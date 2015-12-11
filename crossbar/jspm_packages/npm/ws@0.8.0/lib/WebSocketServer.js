/* */ 
(function(Buffer, process) {
  var util = require('util'),
      events = require('events'),
      http = require('http'),
      crypto = require('crypto'),
      Options = require('options'),
      WebSocket = require('./WebSocket'),
      Extensions = require('./Extensions'),
      PerMessageDeflate = require('./PerMessageDeflate'),
      tls = require('tls'),
      url = require('url');
  function WebSocketServer(options, callback) {
    if (this instanceof WebSocketServer === false) {
      throw new TypeError("Classes can't be function-called");
    }
    events.EventEmitter.call(this);
    options = new Options({
      host: '0.0.0.0',
      port: null,
      server: null,
      verifyClient: null,
      handleProtocols: null,
      path: null,
      noServer: false,
      disableHixie: false,
      clientTracking: true,
      perMessageDeflate: true
    }).merge(options);
    if (!options.isDefinedAndNonNull('port') && !options.isDefinedAndNonNull('server') && !options.value.noServer) {
      throw new TypeError('`port` or a `server` must be provided');
    }
    var self = this;
    if (options.isDefinedAndNonNull('port')) {
      this._server = http.createServer(function(req, res) {
        var body = http.STATUS_CODES[426];
        res.writeHead(426, {
          'Content-Length': body.length,
          'Content-Type': 'text/plain'
        });
        res.end(body);
      });
      this._server.allowHalfOpen = false;
      this._server.listen(options.value.port, options.value.host, callback);
      this._closeServer = function() {
        if (self._server)
          self._server.close();
      };
    } else if (options.value.server) {
      this._server = options.value.server;
      if (options.value.path) {
        if (this._server._webSocketPaths && options.value.server._webSocketPaths[options.value.path]) {
          throw new Error('two instances of WebSocketServer cannot listen on the same http server path');
        }
        if (typeof this._server._webSocketPaths !== 'object') {
          this._server._webSocketPaths = {};
        }
        this._server._webSocketPaths[options.value.path] = 1;
      }
    }
    if (this._server)
      this._server.once('listening', function() {
        self.emit('listening');
      });
    if (typeof this._server != 'undefined') {
      this._server.on('error', function(error) {
        self.emit('error', error);
      });
      this._server.on('upgrade', function(req, socket, upgradeHead) {
        var head = new Buffer(upgradeHead.length);
        upgradeHead.copy(head);
        self.handleUpgrade(req, socket, head, function(client) {
          self.emit('connection' + req.url, client);
          self.emit('connection', client);
        });
      });
    }
    this.options = options.value;
    this.path = options.value.path;
    this.clients = [];
  }
  util.inherits(WebSocketServer, events.EventEmitter);
  WebSocketServer.prototype.close = function() {
    var error = null;
    try {
      for (var i = 0,
          l = this.clients.length; i < l; ++i) {
        this.clients[i].terminate();
      }
    } catch (e) {
      error = e;
    }
    if (this.path && this._server._webSocketPaths) {
      delete this._server._webSocketPaths[this.path];
      if (Object.keys(this._server._webSocketPaths).length == 0) {
        delete this._server._webSocketPaths;
      }
    }
    try {
      if (typeof this._closeServer !== 'undefined') {
        this._closeServer();
      }
    } finally {
      delete this._server;
    }
    if (error)
      throw error;
  };
  WebSocketServer.prototype.handleUpgrade = function(req, socket, upgradeHead, cb) {
    if (this.options.path) {
      var u = url.parse(req.url);
      if (u && u.pathname !== this.options.path)
        return;
    }
    if (typeof req.headers.upgrade === 'undefined' || req.headers.upgrade.toLowerCase() !== 'websocket') {
      abortConnection(socket, 400, 'Bad Request');
      return;
    }
    if (req.headers['sec-websocket-key1'])
      handleHixieUpgrade.apply(this, arguments);
    else
      handleHybiUpgrade.apply(this, arguments);
  };
  module.exports = WebSocketServer;
  function handleHybiUpgrade(req, socket, upgradeHead, cb) {
    var errorHandler = function() {
      try {
        socket.destroy();
      } catch (e) {}
    };
    socket.on('error', errorHandler);
    if (!req.headers['sec-websocket-key']) {
      abortConnection(socket, 400, 'Bad Request');
      return;
    }
    var version = parseInt(req.headers['sec-websocket-version']);
    if ([8, 13].indexOf(version) === -1) {
      abortConnection(socket, 400, 'Bad Request');
      return;
    }
    var protocols = req.headers['sec-websocket-protocol'];
    var origin = version < 13 ? req.headers['sec-websocket-origin'] : req.headers['origin'];
    var extensionsOffer = Extensions.parse(req.headers['sec-websocket-extensions']);
    var self = this;
    var completeHybiUpgrade2 = function(protocol) {
      var key = req.headers['sec-websocket-key'];
      var shasum = crypto.createHash('sha1');
      shasum.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
      key = shasum.digest('base64');
      var headers = ['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', 'Sec-WebSocket-Accept: ' + key];
      if (typeof protocol != 'undefined') {
        headers.push('Sec-WebSocket-Protocol: ' + protocol);
      }
      var extensions = {};
      try {
        extensions = acceptExtensions.call(self, extensionsOffer);
      } catch (err) {
        abortConnection(socket, 400, 'Bad Request');
        return;
      }
      if (Object.keys(extensions).length) {
        var serverExtensions = {};
        Object.keys(extensions).forEach(function(token) {
          serverExtensions[token] = [extensions[token].params];
        });
        headers.push('Sec-WebSocket-Extensions: ' + Extensions.format(serverExtensions));
      }
      self.emit('headers', headers);
      socket.setTimeout(0);
      socket.setNoDelay(true);
      try {
        socket.write(headers.concat('', '').join('\r\n'));
      } catch (e) {
        try {
          socket.destroy();
        } catch (e) {}
        return;
      }
      var client = new WebSocket([req, socket, upgradeHead], {
        protocolVersion: version,
        protocol: protocol,
        extensions: extensions
      });
      if (self.options.clientTracking) {
        self.clients.push(client);
        client.on('close', function() {
          var index = self.clients.indexOf(client);
          if (index != -1) {
            self.clients.splice(index, 1);
          }
        });
      }
      socket.removeListener('error', errorHandler);
      cb(client);
    };
    var completeHybiUpgrade1 = function() {
      if (typeof self.options.handleProtocols == 'function') {
        var protList = (protocols || "").split(/, */);
        var callbackCalled = false;
        var res = self.options.handleProtocols(protList, function(result, protocol) {
          callbackCalled = true;
          if (!result)
            abortConnection(socket, 401, 'Unauthorized');
          else
            completeHybiUpgrade2(protocol);
        });
        if (!callbackCalled) {
          abortConnection(socket, 501, 'Could not process protocols');
        }
        return;
      } else {
        if (typeof protocols !== 'undefined') {
          completeHybiUpgrade2(protocols.split(/, */)[0]);
        } else {
          completeHybiUpgrade2();
        }
      }
    };
    if (typeof this.options.verifyClient == 'function') {
      var info = {
        origin: origin,
        secure: typeof req.connection.authorized !== 'undefined' || typeof req.connection.encrypted !== 'undefined',
        req: req
      };
      if (this.options.verifyClient.length == 2) {
        this.options.verifyClient(info, function(result, code, name) {
          if (typeof code === 'undefined')
            code = 401;
          if (typeof name === 'undefined')
            name = http.STATUS_CODES[code];
          if (!result)
            abortConnection(socket, code, name);
          else
            completeHybiUpgrade1();
        });
        return;
      } else if (!this.options.verifyClient(info)) {
        abortConnection(socket, 401, 'Unauthorized');
        return;
      }
    }
    completeHybiUpgrade1();
  }
  function handleHixieUpgrade(req, socket, upgradeHead, cb) {
    var errorHandler = function() {
      try {
        socket.destroy();
      } catch (e) {}
    };
    socket.on('error', errorHandler);
    if (this.options.disableHixie) {
      abortConnection(socket, 401, 'Hixie support disabled');
      return;
    }
    if (!req.headers['sec-websocket-key2']) {
      abortConnection(socket, 400, 'Bad Request');
      return;
    }
    var origin = req.headers['origin'],
        self = this;
    var onClientVerified = function() {
      var wshost;
      if (!req.headers['x-forwarded-host'])
        wshost = req.headers.host;
      else
        wshost = req.headers['x-forwarded-host'];
      var location = ((req.headers['x-forwarded-proto'] === 'https' || socket.encrypted) ? 'wss' : 'ws') + '://' + wshost + req.url,
          protocol = req.headers['sec-websocket-protocol'];
      var completeHandshake = function(nonce, rest) {
        var k1 = req.headers['sec-websocket-key1'],
            k2 = req.headers['sec-websocket-key2'],
            md5 = crypto.createHash('md5');
        [k1, k2].forEach(function(k) {
          var n = parseInt(k.replace(/[^\d]/g, '')),
              spaces = k.replace(/[^ ]/g, '').length;
          if (spaces === 0 || n % spaces !== 0) {
            abortConnection(socket, 400, 'Bad Request');
            return;
          }
          n /= spaces;
          md5.update(String.fromCharCode(n >> 24 & 0xFF, n >> 16 & 0xFF, n >> 8 & 0xFF, n & 0xFF));
        });
        md5.update(nonce.toString('binary'));
        var headers = ['HTTP/1.1 101 Switching Protocols', 'Upgrade: WebSocket', 'Connection: Upgrade', 'Sec-WebSocket-Location: ' + location];
        if (typeof protocol != 'undefined')
          headers.push('Sec-WebSocket-Protocol: ' + protocol);
        if (typeof origin != 'undefined')
          headers.push('Sec-WebSocket-Origin: ' + origin);
        socket.setTimeout(0);
        socket.setNoDelay(true);
        try {
          var headerBuffer = new Buffer(headers.concat('', '').join('\r\n'));
          var hashBuffer = new Buffer(md5.digest('binary'), 'binary');
          var handshakeBuffer = new Buffer(headerBuffer.length + hashBuffer.length);
          headerBuffer.copy(handshakeBuffer, 0);
          hashBuffer.copy(handshakeBuffer, headerBuffer.length);
          socket.write(handshakeBuffer, 'binary', function(err) {
            if (err)
              return;
            var client = new WebSocket([req, socket, rest], {
              protocolVersion: 'hixie-76',
              protocol: protocol
            });
            if (self.options.clientTracking) {
              self.clients.push(client);
              client.on('close', function() {
                var index = self.clients.indexOf(client);
                if (index != -1) {
                  self.clients.splice(index, 1);
                }
              });
            }
            socket.removeListener('error', errorHandler);
            cb(client);
          });
        } catch (e) {
          try {
            socket.destroy();
          } catch (e) {}
          return;
        }
      };
      var nonceLength = 8;
      if (upgradeHead && upgradeHead.length >= nonceLength) {
        var nonce = upgradeHead.slice(0, nonceLength);
        var rest = upgradeHead.length > nonceLength ? upgradeHead.slice(nonceLength) : null;
        completeHandshake.call(self, nonce, rest);
      } else {
        var nonce = new Buffer(nonceLength);
        upgradeHead.copy(nonce, 0);
        var received = upgradeHead.length;
        var rest = null;
        var handler = function(data) {
          var toRead = Math.min(data.length, nonceLength - received);
          if (toRead === 0)
            return;
          data.copy(nonce, received, 0, toRead);
          received += toRead;
          if (received == nonceLength) {
            socket.removeListener('data', handler);
            if (toRead < data.length)
              rest = data.slice(toRead);
            completeHandshake.call(self, nonce, rest);
          }
        };
        socket.on('data', handler);
      }
    };
    if (typeof this.options.verifyClient == 'function') {
      var info = {
        origin: origin,
        secure: typeof req.connection.authorized !== 'undefined' || typeof req.connection.encrypted !== 'undefined',
        req: req
      };
      if (this.options.verifyClient.length == 2) {
        var self = this;
        this.options.verifyClient(info, function(result, code, name) {
          if (typeof code === 'undefined')
            code = 401;
          if (typeof name === 'undefined')
            name = http.STATUS_CODES[code];
          if (!result)
            abortConnection(socket, code, name);
          else
            onClientVerified.apply(self);
        });
        return;
      } else if (!this.options.verifyClient(info)) {
        abortConnection(socket, 401, 'Unauthorized');
        return;
      }
    }
    onClientVerified();
  }
  function acceptExtensions(offer) {
    var extensions = {};
    var options = this.options.perMessageDeflate;
    if (options && offer[PerMessageDeflate.extensionName]) {
      var perMessageDeflate = new PerMessageDeflate(options !== true ? options : {}, true);
      perMessageDeflate.accept(offer[PerMessageDeflate.extensionName]);
      extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
    }
    return extensions;
  }
  function abortConnection(socket, code, name) {
    try {
      var response = ['HTTP/1.1 ' + code + ' ' + name, 'Content-type: text/html'];
      socket.write(response.concat('', '').join('\r\n'));
    } catch (e) {} finally {
      try {
        socket.destroy();
      } catch (e) {}
    }
  }
})(require('buffer').Buffer, require('process'));
