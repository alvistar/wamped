/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var error = require('./error');
    var unhandledRejectionsMsg = '[promises] Unhandled rejections: ';
    var allHandledMsg = '[promises] All previously unhandled rejections have now been handled';
    function ConsoleReporter() {
      this._previouslyReported = false;
    }
    ConsoleReporter.prototype = initDefaultLogging();
    ConsoleReporter.prototype.log = function(traces) {
      if (traces.length === 0) {
        if (this._previouslyReported) {
          this._previouslyReported = false;
          this.msg(allHandledMsg);
        }
        return;
      }
      this._previouslyReported = true;
      this.groupStart(unhandledRejectionsMsg + traces.length);
      try {
        this._log(traces);
      } finally {
        this.groupEnd();
      }
    };
    ConsoleReporter.prototype._log = function(traces) {
      for (var i = 0; i < traces.length; ++i) {
        this.warn(error.format(traces[i]));
      }
    };
    function initDefaultLogging() {
      var log,
          warn,
          groupStart,
          groupEnd;
      if (typeof console === 'undefined') {
        log = warn = consoleNotAvailable;
      } else {
        var localConsole = console;
        if (typeof localConsole.error === 'function' && typeof localConsole.dir === 'function') {
          warn = function(s) {
            localConsole.error(s);
          };
          log = function(s) {
            localConsole.log(s);
          };
          if (typeof localConsole.groupCollapsed === 'function') {
            groupStart = function(s) {
              localConsole.groupCollapsed(s);
            };
            groupEnd = function() {
              localConsole.groupEnd();
            };
          }
        } else {
          if (typeof localConsole.log !== 'undefined' && typeof JSON !== 'undefined') {
            log = warn = function(x) {
              if (typeof x !== 'string') {
                try {
                  x = JSON.stringify(x);
                } catch (e) {}
              }
              localConsole.log(x);
            };
          } else {
            log = warn = consoleNotAvailable;
          }
        }
      }
      return {
        msg: log,
        warn: warn,
        groupStart: groupStart || warn,
        groupEnd: groupEnd || consoleNotAvailable
      };
    }
    function consoleNotAvailable() {}
    return ConsoleReporter;
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
