/* */ 
"format cjs";
(function(process) {
  (function(define) {
    'use strict';
    define(function(require) {
      var MutationObs;
      var capturedSetTimeout = typeof setTimeout !== 'undefined' && setTimeout;
      var setTimer = function(f, ms) {
        return setTimeout(f, ms);
      };
      var clearTimer = function(t) {
        return clearTimeout(t);
      };
      var asap = function(f) {
        return capturedSetTimeout(f, 0);
      };
      if (isNode()) {
        asap = function(f) {
          return process.nextTick(f);
        };
      } else if (MutationObs = hasMutationObserver()) {
        asap = initMutationObserver(MutationObs);
      } else if (!capturedSetTimeout) {
        var vertxRequire = require;
        var vertx = vertxRequire('vertx');
        setTimer = function(f, ms) {
          return vertx.setTimer(ms, f);
        };
        clearTimer = vertx.cancelTimer;
        asap = vertx.runOnLoop || vertx.runOnContext;
      }
      return {
        setTimer: setTimer,
        clearTimer: clearTimer,
        asap: asap
      };
      function isNode() {
        return typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';
      }
      function hasMutationObserver() {
        return (typeof MutationObserver === 'function' && MutationObserver) || (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver);
      }
      function initMutationObserver(MutationObserver) {
        var scheduled;
        var node = document.createTextNode('');
        var o = new MutationObserver(run);
        o.observe(node, {characterData: true});
        function run() {
          var f = scheduled;
          scheduled = void 0;
          f();
        }
        var i = 0;
        return function(f) {
          scheduled = f;
          node.data = (i ^= 1);
        };
      }
    });
  }(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  }));
})(require('process'));
