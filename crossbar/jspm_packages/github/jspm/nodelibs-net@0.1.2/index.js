/* */ 
(function(Buffer, process) {
  if (System._nodeRequire) {
    module.exports = System._nodeRequire('net');
  } else {
    var stream = require('stream');
    var util = require('util');
    var timers = require('timers');
    var http = require('http');
    var debug = util.debuglog('net');
    var proxy = {
      hostname: window.location.hostname,
      port: window.location.port
    };
    function getProxy() {
      return proxy;
    }
    function getProxyHost() {
      var host = getProxy().hostname;
      if (getProxy().port) {
        host += ':' + getProxy().port;
      }
      return host;
    }
    exports.setProxy = function(options) {
      options = options || {};
      proxy.hostname = options.hostname;
      proxy.port = options.port;
    };
    exports.createServer = function() {
      throw new Error('Cannot create server in a browser');
    };
    exports.connect = exports.createConnection = function() {
      var args = normalizeConnectArgs(arguments);
      debug('createConnection', args);
      var s = new Socket(args[0]);
      return Socket.prototype.connect.apply(s, args);
    };
    function toNumber(x) {
      return (x = Number(x)) >= 0 ? x : false;
    }
    function isPipeName(s) {
      return util.isString(s) && toNumber(s) === false;
    }
    function normalizeConnectArgs(args) {
      var options = {};
      if (util.isObject(args[0])) {
        options = args[0];
      } else if (isPipeName(args[0])) {
        options.path = args[0];
      } else {
        options.port = args[0];
        if (util.isString(args[1])) {
          options.host = args[1];
        }
      }
      var cb = args[args.length - 1];
      return util.isFunction(cb) ? [options, cb] : [options];
    }
    exports._normalizeConnectArgs = normalizeConnectArgs;
    function Socket(options) {
      if (!(this instanceof Socket))
        return new Socket(options);
      this._connecting = false;
      this._host = null;
      if (util.isNumber(options))
        options = {fd: options};
      else if (util.isUndefined(options))
        options = {};
      stream.Duplex.call(this, options);
      this.readable = this.writable = false;
      this._writableState.decodeStrings = false;
      this.allowHalfOpen = options && options.allowHalfOpen || false;
    }
    util.inherits(Socket, stream.Duplex);
    exports.Socket = Socket;
    exports.Stream = Socket;
    Socket.prototype.listen = function() {
      throw new Error('Cannot listen in a browser');
    };
    Socket.prototype.setTimeout = function(msecs, callback) {
      if (msecs > 0 && isFinite(msecs)) {
        timers.enroll(this, msecs);
        if (callback) {
          this.once('timeout', callback);
        }
      } else if (msecs === 0) {
        timers.unenroll(this);
        if (callback) {
          this.removeListener('timeout', callback);
        }
      }
    };
    Socket.prototype._onTimeout = function() {
      debug('_onTimeout');
      this.emit('timeout');
    };
    Socket.prototype.setNoDelay = function(enable) {};
    Socket.prototype.setKeepAlive = function(setting, msecs) {};
    Socket.prototype.address = function() {
      return {
        address: this.remoteAddress,
        port: this.remotePort,
        family: this.remoteFamily
      };
    };
    Object.defineProperty(Socket.prototype, 'readyState', {get: function() {
        if (this._connecting) {
          return 'opening';
        } else if (this.readable && this.writable) {
          return 'open';
        } else if (this.readable && !this.writable) {
          return 'readOnly';
        } else if (!this.readable && this.writable) {
          return 'writeOnly';
        } else {
          return 'closed';
        }
      }});
    Socket.prototype.bufferSize = undefined;
    Socket.prototype._read = function() {};
    Socket.prototype.end = function(data, encoding) {
      stream.Duplex.prototype.end.call(this, data, encoding);
      this.writable = false;
      if (this._ws) {
        this._ws.close();
      }
      if (this.readable && !this._readableState.endEmitted)
        this.read(0);
      else
        maybeDestroy(this);
    };
    function maybeDestroy(socket) {
      if (!socket.readable && !socket.writable && !socket.destroyed && !socket._connecting && !socket._writableState.length) {
        socket.destroy();
      }
    }
    Socket.prototype.destroySoon = function() {
      if (this.writable)
        this.end();
      if (this._writableState.finished)
        this.destroy();
      else
        this.once('finish', this.destroy);
    };
    Socket.prototype.destroy = function(exception) {
      debug('destroy', exception);
      if (this.destroyed) {
        return;
      }
      self._connecting = false;
      this.readable = this.writable = false;
      timers.unenroll(this);
      debug('close');
      this.destroyed = true;
    };
    Socket.prototype.remoteAddress = null;
    Socket.prototype.remoteFamily = null;
    Socket.prototype.remotePort = null;
    Socket.prototype.localAddress = null;
    Socket.prototype.localPort = null;
    Socket.prototype.bytesRead = 0;
    Socket.prototype.bytesWritten = 0;
    Socket.prototype._write = function(data, encoding, cb) {
      var self = this;
      cb = cb || function() {};
      if (this._connecting) {
        this._pendingData = data;
        this._pendingEncoding = encoding;
        this.once('connect', function() {
          this._write(data, encoding, cb);
        });
        return;
      }
      this._pendingData = null;
      this._pendingEncoding = '';
      if (encoding == 'binary' && typeof data == 'string') {
        data = new Buffer(data, encoding);
      }
      this._ws.send(data);
      process.nextTick(function() {
        self.bytesWritten += data.length;
        cb();
      });
    };
    Socket.prototype.write = function(chunk, encoding, cb) {
      if (!util.isString(chunk) && !util.isBuffer(chunk))
        throw new TypeError('invalid data');
      return stream.Duplex.prototype.write.apply(this, arguments);
    };
    Socket.prototype.connect = function(options, cb) {
      var self = this;
      if (!util.isObject(options)) {
        var args = normalizeConnectArgs(arguments);
        return Socket.prototype.connect.apply(this, args);
      }
      cb = cb || function() {};
      if (this.write !== Socket.prototype.write)
        this.write = Socket.prototype.write;
      if (options.path) {
        throw new Error('options.path not supported in the browser');
      }
      self._connecting = true;
      self.writable = true;
      self._host = options.host;
      var req = http.request({
        hostname: getProxy().hostname,
        port: getProxy().port,
        path: '/api/vm/net/connect',
        method: 'POST'
      }, function(res) {
        var json = '';
        res.on('data', function(buf) {
          json += buf;
        });
        res.on('end', function() {
          var data = null;
          try {
            data = JSON.parse(json);
          } catch (e) {
            data = {
              code: res.statusCode,
              error: json
            };
          }
          if (data.error) {
            self.emit('error', 'Cannot open TCP connection [' + res.statusCode + ']: ' + data.error);
            self.destroy();
            return;
          }
          self.remoteAddress = data.remote.address;
          self.remoteFamily = data.remote.family;
          self.remotePort = data.remote.port;
          self._connectWebSocket(data.token, function(err) {
            if (err) {
              cb(err);
              return;
            }
            cb();
          });
        });
      });
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(options));
      req.end();
      return this;
    };
    Socket.prototype._connectWebSocket = function(token, cb) {
      var self = this;
      if (self._ws) {
        process.nextTick(function() {
          cb();
        });
        return;
      }
      this._ws = new WebSocket('ws://' + getProxyHost() + '/api/vm/net/socket?token=' + token);
      this._handleWebsocket();
      if (cb) {
        self.on('connect', cb);
      }
    };
    Socket.prototype._handleWebsocket = function() {
      var self = this;
      this._ws.addEventListener('open', function() {
        self._connecting = false;
        self.readable = true;
        self.emit('connect');
        self.read(0);
      });
      this._ws.addEventListener('error', function(e) {
        self.emit('error', 'An error occured with the WebSocket');
      });
      this._ws.addEventListener('message', function(e) {
        var contents = e.data;
        var gotBuffer = function(buffer) {
          self.bytesRead += buffer.length;
          self.push(buffer);
        };
        if (typeof contents == 'string') {
          var buffer = new Buffer(contents);
          gotBuffer(buffer);
        } else if (window.Blob && contents instanceof Blob) {
          var fileReader = new FileReader();
          fileReader.addEventListener('load', function(e) {
            var buf = fileReader.result;
            var arr = new Uint8Array(buf);
            gotBuffer(new Buffer(arr));
          });
          fileReader.readAsArrayBuffer(contents);
        } else {
          console.warn('Cannot read TCP stream: unsupported message type', contents);
        }
      });
      this._ws.addEventListener('close', function() {
        if (self.readyState == 'open') {
          self.destroy();
        }
      });
    };
    exports.isIP = function(input) {
      if (exports.isIPv4(input)) {
        return 4;
      } else if (exports.isIPv6(input)) {
        return 6;
      } else {
        return 0;
      }
    };
    exports.isIPv4 = function(input) {
      return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
    };
    exports.isIPv6 = function(input) {
      return /^(([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))$/.test(input);
    };
  }
})(require('buffer').Buffer, require('process'));
