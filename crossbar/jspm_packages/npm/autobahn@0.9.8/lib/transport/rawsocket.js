/* */ 
(function(Buffer) {
  var util = require('../util');
  var log = require('../log');
  var EventEmitter = require('events').EventEmitter;
  function Factory(options) {
    var self = this;
    if (!options.protocols) {
      options.protocols = ['wamp.2.json'];
    } else {
      util.assert(Array.isArray(options.protocols), "options.protocols must be an array");
    }
    options.rawsocket_max_len_exp = options.rawsocket_max_len_exp || 24;
    self._options = options;
  }
  Factory.prototype.type = "rawsocket";
  Factory.prototype.create = function() {
    var self = this;
    var transport = {};
    transport.protocol = undefined;
    transport.send = undefined;
    transport.close = undefined;
    transport.onmessage = function() {};
    transport.onopen = function() {};
    transport.onclose = function() {};
    transport.info = {
      type: 'rawsocket',
      url: null,
      protocol: 'wamp.2.json'
    };
    if (global.process && global.process.versions.node) {
      (function() {
        var net = require('net');
        var socket,
            protocol;
        if (self._options.path) {
          connectionOptions = {
            path: self._options.path,
            allowHalfOpen: true
          };
        } else if (self._options.port) {
          connectionOptions = {
            port: self._options.port || 8000,
            host: self._options.host || 'localhost',
            allowHalfOpen: true
          };
        } else {
          throw "You must specify a host/port combination or a unix socket path to connect to";
        }
        socket = net.connect(connectionOptions);
        protocol = new Protocol(socket, {
          serializer: 'json',
          max_len_exp: self._options.rawsocket_max_len_exp
        });
        protocol.on('connect', function(msg) {
          log.debug('RawSocket transport negociated');
          transport.onopen(msg);
        });
        protocol.on('data', function(msg) {
          log.debug('RawSocket transport received', msg);
          transport.onmessage(msg);
        });
        protocol.on('close', function(had_error) {
          log.debug('RawSocket transport closed');
          transport.onclose({
            code: 999,
            reason: '',
            wasClean: !had_error
          });
        });
        protocol.on('error', function(error) {
          log.debug('RawSocket transport error', error);
        });
        transport.close = function(code, reason) {
          log.debug('RawSocket transport closing', code, reason);
          protocol.close();
        };
        transport.send = function(msg) {
          log.debug('RawSocket transport sending', msg);
          protocol.write(msg);
        };
      })();
    } else {
      throw "No RawSocket support in browser";
    }
    return transport;
  };
  function Protocol(stream, options) {
    this._options = {
      _peer_serializer: null,
      _peer_max_len_exp: 0
    };
    this._options = util.defaults(this._options, options, this.DEFAULT_OPTIONS);
    util.assert(this._options.serializer in this.SERIALIZERS, 'Unsupported serializer: ' + this._options.serializer);
    util.assert(this._options.max_len_exp >= 9 && this._options.max_len_exp <= 36, 'Message length out of bounds [9, 36]: ' + this._options.max_len_exp);
    util.assert(!this._options.autoping || (Number.isInteger(this._options.autoping) && this._options.autoping >= 0), 'Autoping interval must be positive');
    util.assert(!this._options.ping_timeout || (Number.isInteger(this._options.ping_timeout) && this._options.ping_timeout >= 0), 'Ping timeout duration must be positive');
    util.assert(!this._options.packet_timeout || (Number.isInteger(this._options.packet_timeout) && this._options.packet_timeout >= 0), 'Packet timeout duration must be positive');
    util.assert((!this._options.autoping || !this._options.ping_timeout) || this._options.autoping > this._options.ping_timeout, 'Autoping interval (' + this._options.autoping + ') must be lower ' + 'than ping timeout (' + this._options.ping_timeout + ')');
    this._ping_timeout = null;
    this._ping_payload = null;
    this._ping_interval = null;
    this._status = this.STATUS.UNINITIATED;
    this._stream = stream;
    this._emitter = new EventEmitter();
    this._buffer = new Buffer(4);
    this._bufferLen = 0;
    this._msgLen = 0;
    var self = this;
    this._stream.on('data', function(data) {
      self._read(data);
    });
    this._stream.on('connect', function() {
      self._handshake();
    });
    var proxyEvents = ['close', 'drain', 'end', 'error', 'timeout'];
    proxyEvents.forEach(function(evt) {
      self._stream.on(evt, function(data) {
        self._emitter.emit(evt, data);
      });
    });
  }
  Protocol.prototype._MAGIC_BYTE = 0x7f;
  Protocol.prototype.SERIALIZERS = {json: 1};
  Protocol.prototype.STATUS = {
    CLOSED: -1,
    UNINITIATED: 0,
    NEGOCIATING: 1,
    NEGOCIATED: 2,
    RXHEAD: 3,
    RXDATA: 4,
    RXPING: 5,
    RXPONG: 6
  };
  Protocol.prototype.ERRORS = {
    0: "illegal (must not be used)",
    1: "serializer unsupported",
    2: "maximum message length unacceptable",
    3: "use of reserved bits (unsupported feature)",
    4: "maximum connection count reached"
  };
  Protocol.prototype.MSGTYPES = {
    WAMP: 0x0,
    PING: 0x1,
    PONG: 0x2
  };
  Protocol.prototype.DEFAULT_OPTIONS = {
    fail_on_ping_timeout: true,
    strict_pong: true,
    ping_timeout: 2000,
    autoping: 0,
    max_len_exp: 24,
    serializer: 'json',
    packet_timeout: 2000
  };
  Protocol.prototype.close = function() {
    this._status = this.STATUS.CLOSED;
    this._stream.close();
    return this.STATUS.CLOSED;
  };
  Protocol.prototype.write = function(msg, type, callback) {
    type = type === undefined ? 0 : type;
    if (type === this.MSGTYPES.WAMP) {
      msg = JSON.stringify(msg);
    }
    var msgLen = Buffer.byteLength(msg, 'utf8');
    if (msgLen > Math.pow(2, this._options._peer_max_len_exp)) {
      this._emitter.emit('error', new ProtocolError('Frame too big'));
      return;
    }
    var frame = new Buffer(msgLen + 4);
    frame.writeUInt8(type, 0);
    frame.writeUIntBE(msgLen, 1, 3);
    frame.write(msg, 4);
    this._stream.write(frame, callback);
  };
  Protocol.prototype.ping = function(payload) {
    payload = payload || 255;
    if (Number.isInteger(payload)) {
      var base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789&~"#\'{([-|`_\\^@)]=},?;.:/!*$<>';
      var len = Math.max(1, payload);
      for (var i = 0; i < len; i++)
        payload += base.charAt((Math.random() * base.length) | 0);
    }
    this._ping_payload = payload;
    return this.write(payload, this.MSGTYPES.PING, this._setupPingTimeout.bind(this));
  };
  Protocol.prototype._setupPingTimeout = function() {
    if (this._options.ping_timeout) {
      this._ping_timeout = setTimeout(this._onPingTimeout.bind(this), this._options.ping_timeout);
    }
  };
  Protocol.prototype._clearPingTimeout = function() {
    if (this._ping_timeout) {
      clearTimeout(this._ping_timeout);
      this._ping_timeout = null;
    }
  };
  Protocol.prototype._setupAutoPing = function() {
    this._clearAutoPing();
    if (this._options.autoping) {
      this._autoping_interval = setInterval(this.ping.bind(this), this._options.autoping);
    }
  };
  Protocol.prototype._clearAutoPing = function() {
    if (this._autoping_interval) {
      clearInterval(this._autoping_interval);
      this._autoping_interval = null;
    }
  };
  Protocol.prototype._onPingTimeout = function() {
    this._emitter.emit('error', new ProtocolError('PING timeout'));
    if (this._options.fail_on_ping_timeout) {
      this.close();
    }
  };
  Protocol.prototype._read = function(data) {
    var handler,
        frame;
    switch (this._status) {
      case this.STATUS.CLOSED:
      case this.STATUS.UNINITIATED:
        this._emitter.emit('error', ProtocolError('Unexpected packet'));
        break;
      case this.STATUS.NEGOCIATING:
        handler = this._handleHandshake;
        frame = 4;
        break;
      case this.STATUS.NEGOCIATED:
      case this.STATUS.RXHEAD:
        this._status = this.STATUS.RXHEAD;
        handler = this._handleHeaderPacket;
        frame = 4;
        break;
      case this.STATUS.RXDATA:
        handler = this._handleDataPacket;
        frame = this._msgLen;
        break;
      case this.STATUS.RXPING:
        handler = this._handlePingPacket;
        frame = this._msgLen;
        break;
      case this.STATUS.RXPONG:
        handler = this._handlePongPacket;
        frame = this._msgLen;
        break;
    }
    var chunks = this._splitBytes(data, frame);
    if (!chunks)
      return;
    this._status = handler.call(this, chunks[0]);
    if (chunks[1].length > 0) {
      this._read(chunks[1]);
    }
  };
  Protocol.prototype._handshake = function() {
    if (this._status !== this.STATUS.UNINITIATED) {
      throw 'Handshake packet already sent';
    }
    var gday = new Buffer(4);
    gday.writeUInt8(this._MAGIC_BYTE, 0);
    gday.writeUInt8((this._options.max_len_exp - 9) << 4 | this.SERIALIZERS[this._options.serializer], 1);
    gday.writeUInt8(0x00, 2);
    gday.writeUInt8(0x00, 3);
    this._stream.write(gday);
    this._status = this.STATUS.NEGOCIATING;
  };
  Protocol.prototype._splitBytes = function(data, len) {
    if (len !== this._buffer.length) {
      this._buffer = new Buffer(len);
      this._bufferLen = 0;
    }
    data.copy(this._buffer, this._bufferLen);
    if (this._bufferLen + data.length < len) {
      this._bufferLen += data.length;
      return null;
    } else {
      var bytes = this._buffer.slice();
      var extra = data.slice(len - this._bufferLen);
      this._bufferLen = 0;
      return [bytes, extra];
    }
  };
  Protocol.prototype._handleHandshake = function(int32) {
    if (int32[0] !== this._MAGIC_BYTE) {
      this._emitter.emit('error', new ProtocolError('Invalid magic byte. Expected 0x' + this._MAGIC_BYTE.toString(16) + ', got 0x' + int32[0].toString(16)));
      return this.close();
    }
    if ((int32[1] & 0x0f) === 0) {
      var errcode = int32[1] >> 4;
      this._emitter.emit('error', new ProtocolError('Peer failed handshake: ' + (this.ERRORS[errcode] || '0x' + errcode.toString(16))));
      return this.close();
    }
    this._options._peer_max_len_exp = (int32[1] >> 4) + 9;
    this._options._peer_serializer = int32[1] & 0x0f;
    if (this._options._peer_serializer !== this.SERIALIZERS.json) {
      this._emitter.emit('error', new ProtocolError('Unsupported serializer: 0x' + this._options._peer_serializer.toString(16)));
      return this.close();
    }
    this._emitter.emit('connect');
    this._setupAutoPing();
    return this.STATUS.NEGOCIATED;
  };
  Protocol.prototype._handleHeaderPacket = function(int32) {
    var type = int32[0] & 0x0f;
    this._msgLen = int32.readUIntBE(1, 3);
    switch (type) {
      case this.MSGTYPES.WAMP:
        return this.STATUS.RXDATA;
      case this.MSGTYPES.PING:
        return this.STATUS.RXPING;
      case this.MSGTYPES.PONG:
        return this.STATUS.RXPONG;
      default:
        this._emitter.emit('error', new ProtocolError('Invalid frame type: 0x' + status.toString(16)));
        return this.close();
    }
  };
  Protocol.prototype._handleDataPacket = function(buffer) {
    var msg;
    try {
      msg = JSON.parse(buffer.toString('utf8'));
    } catch (e) {
      this._emitter.emit('error', new ProtocolError('Invalid JSON frame'));
      return this.STATUS.RXHEAD;
    }
    this._emitter.emit('data', msg);
    return this.STATUS.RXHEAD;
  };
  Protocol.prototype._handlePingPacket = function(buffer) {
    this.write(buffer.toString('utf8'), this.MSGTYPES.PONG);
    return this.STATUS.RXHEAD;
  };
  Protocol.prototype._handlePongPacket = function(buffer) {
    this._clearPingTimeout();
    if (this._options.strict_pong && this._ping_payload !== buffer.toString('utf8')) {
      this._emitter.emit('error', new ProtocolError('PONG response payload doesn\'t match PING.'));
      return this.close();
    }
    return this.STATUS.RXHEAD;
  };
  Protocol.prototype.on = function(evt, handler) {
    return this._emitter.on(evt, handler);
  };
  Protocol.prototype.once = function(evt, handler) {
    return this._emitter.once(evt, handler);
  };
  Protocol.prototype.removeListener = function(evt, handler) {
    return this._emitter.removeListener(evt, handler);
  };
  var ProtocolError = exports.ProtocolError = function(msg) {
    Error.apply(this, Array.prototype.splice.call(arguments));
    Error.captureStackTrace(this, this.constructor);
    this.message = msg;
    this.name = 'ProtocolError';
  };
  ProtocolError.prototype = Object.create(Error.prototype);
  exports.Factory = Factory;
  exports.Protocol = Protocol;
})(require('buffer').Buffer);
