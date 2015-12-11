/* */ 
var util = require('../util');
var log = require('../log');
function Factory(options) {
  var self = this;
  util.assert(options.url !== undefined, "options.url missing");
  util.assert(typeof options.url === "string", "options.url must be a string");
  if (!options.protocols) {
    options.protocols = ['wamp.2.json'];
  } else {
    util.assert(Array.isArray(options.protocols), "options.protocols must be an array");
  }
  self._options = options;
}
Factory.prototype.type = "websocket";
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
    type: 'websocket',
    url: null,
    protocol: 'wamp.2.json'
  };
  if (global.process && global.process.versions.node) {
    (function() {
      var WebSocket = require('ws');
      var websocket;
      var protocols;
      if (self._options.protocols) {
        protocols = self._options.protocols;
        if (Array.isArray(protocols)) {
          protocols = protocols.join(',');
        }
        websocket = new WebSocket(self._options.url, {protocol: protocols});
      } else {
        websocket = new WebSocket(self._options.url);
      }
      transport.send = function(msg) {
        var payload = JSON.stringify(msg);
        websocket.send(payload, {binary: false});
      };
      transport.close = function(code, reason) {
        websocket.close();
      };
      websocket.on('open', function() {
        transport.onopen();
      });
      websocket.on('message', function(data, flags) {
        if (flags.binary) {} else {
          var msg = JSON.parse(data);
          transport.onmessage(msg);
        }
      });
      websocket.on('close', function(code, message) {
        var details = {
          code: code,
          reason: message,
          wasClean: code === 1000
        };
        transport.onclose(details);
      });
      websocket.on('error', function(error) {
        var details = {
          code: 1006,
          reason: '',
          wasClean: false
        };
        transport.onclose(details);
      });
    })();
  } else {
    (function() {
      var websocket;
      if ("WebSocket" in global) {
        if (self._options.protocols) {
          websocket = new global.WebSocket(self._options.url, self._options.protocols);
        } else {
          websocket = new global.WebSocket(self._options.url);
        }
      } else if ("MozWebSocket" in global) {
        if (self._options.protocols) {
          websocket = new global.MozWebSocket(self._options.url, self._options.protocols);
        } else {
          websocket = new global.MozWebSocket(self._options.url);
        }
      } else {
        throw "browser does not support WebSocket or WebSocket in Web workers";
      }
      websocket.onmessage = function(evt) {
        log.debug("WebSocket transport receive", evt.data);
        var msg = JSON.parse(evt.data);
        transport.onmessage(msg);
      };
      websocket.onopen = function() {
        transport.info.url = self._options.url;
        transport.onopen();
      };
      websocket.onclose = function(evt) {
        var details = {
          code: evt.code,
          reason: evt.message,
          wasClean: evt.wasClean
        };
        transport.onclose(details);
      };
      transport.send = function(msg) {
        var payload = JSON.stringify(msg);
        log.debug("WebSocket transport send", payload);
        websocket.send(payload);
      };
      transport.close = function(code, reason) {
        websocket.close(code, reason);
      };
    })();
  }
  return transport;
};
exports.Factory = Factory;
