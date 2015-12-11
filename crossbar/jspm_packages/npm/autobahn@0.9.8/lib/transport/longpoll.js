/* */ 
var util = require('../util');
var log = require('../log');
var when = require('when');
function Factory(options) {
  var self = this;
  util.assert(options.url !== undefined, "options.url missing");
  util.assert(typeof options.url === "string", "options.url must be a string");
  self._options = options;
}
;
Factory.prototype.type = "longpoll";
Factory.prototype.create = function() {
  var self = this;
  log.debug("longpoll.Factory.create");
  var transport = {};
  transport.protocol = undefined;
  transport.send = undefined;
  transport.close = undefined;
  transport.onmessage = function() {};
  transport.onopen = function() {};
  transport.onclose = function() {};
  transport.info = {
    type: 'longpoll',
    url: null,
    protocol: 'wamp.2.json'
  };
  transport._run = function() {
    var session_info = null;
    var send_buffer = [];
    var is_closing = false;
    var txseq = 0;
    var rxseq = 0;
    var options = {'protocols': ['wamp.2.json']};
    var request_timeout = self._options.request_timeout || 12000;
    util.http_post(self._options.url + '/open', JSON.stringify(options), request_timeout).then(function(payload) {
      session_info = JSON.parse(payload);
      var base_url = self._options.url + '/' + session_info.transport;
      transport.info.url = base_url;
      log.debug("longpoll.Transport: open", session_info);
      transport.close = function(code, reason) {
        if (is_closing) {
          throw "transport is already closing";
        }
        is_closing = true;
        util.http_post(base_url + '/close', null, request_timeout).then(function() {
          log.debug("longpoll.Transport: transport closed");
          var details = {
            code: 1000,
            reason: "transport closed",
            wasClean: true
          };
          transport.onclose(details);
        }, function(err) {
          log.debug("longpoll.Transport: could not close transport", err.code, err.text);
        });
      };
      transport.send = function(msg) {
        if (is_closing) {
          throw "transport is closing or closed already";
        }
        txseq += 1;
        log.debug("longpoll.Transport: sending message ...", msg);
        var payload = JSON.stringify(msg);
        util.http_post(base_url + '/send', payload, request_timeout).then(function() {
          log.debug("longpoll.Transport: message sent");
        }, function(err) {
          log.debug("longpoll.Transport: could not send message", err.code, err.text);
          is_closing = true;
          var details = {
            code: 1001,
            reason: "transport send failure (HTTP/POST status " + err.code + " - '" + err.text + "')",
            wasClean: false
          };
          transport.onclose(details);
        });
      };
      function receive() {
        rxseq += 1;
        log.debug("longpoll.Transport: polling for message ...");
        util.http_post(base_url + '/receive', null, request_timeout).then(function(payload) {
          if (payload) {
            var msg = JSON.parse(payload);
            log.debug("longpoll.Transport: message received", msg);
            transport.onmessage(msg);
          }
          if (!is_closing) {
            receive();
          }
        }, function(err) {
          log.debug("longpoll.Transport: could not receive message", err.code, err.text);
          is_closing = true;
          var details = {
            code: 1001,
            reason: "transport receive failure (HTTP/POST status " + err.code + " - '" + err.text + "')",
            wasClean: false
          };
          transport.onclose(details);
        });
      }
      receive();
      transport.onopen();
    }, function(err) {
      log.debug("longpoll.Transport: could not open transport", err.code, err.text);
      is_closing = true;
      var details = {
        code: 1001,
        reason: "transport open failure (HTTP/POST status " + err.code + " - '" + err.text + "')",
        wasClean: false
      };
      transport.onclose(details);
    });
  };
  transport._run();
  return transport;
};
exports.Factory = Factory;
