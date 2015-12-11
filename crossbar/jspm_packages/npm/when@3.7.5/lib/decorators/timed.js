/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var env = require('../env');
    var TimeoutError = require('../TimeoutError');
    function setTimeout(f, ms, x, y) {
      return env.setTimer(function() {
        f(x, y, ms);
      }, ms);
    }
    return function timed(Promise) {
      Promise.prototype.delay = function(ms) {
        var p = this._beget();
        this._handler.fold(handleDelay, ms, void 0, p._handler);
        return p;
      };
      function handleDelay(ms, x, h) {
        setTimeout(resolveDelay, ms, x, h);
      }
      function resolveDelay(x, h) {
        h.resolve(x);
      }
      Promise.prototype.timeout = function(ms, reason) {
        var p = this._beget();
        var h = p._handler;
        var t = setTimeout(onTimeout, ms, reason, p._handler);
        this._handler.visit(h, function onFulfill(x) {
          env.clearTimer(t);
          this.resolve(x);
        }, function onReject(x) {
          env.clearTimer(t);
          this.reject(x);
        }, h.notify);
        return p;
      };
      function onTimeout(reason, h, ms) {
        var e = typeof reason === 'undefined' ? new TimeoutError('timed out after ' + ms + 'ms') : reason;
        h.reject(e);
      }
      return Promise;
    };
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
