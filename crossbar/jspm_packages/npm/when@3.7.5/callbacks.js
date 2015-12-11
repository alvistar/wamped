/* */ 
"format cjs";
(function(process) {
  (function(define) {
    define(function(require) {
      var when = require('./when');
      var Promise = when.Promise;
      var _liftAll = require('./lib/liftAll');
      var slice = Array.prototype.slice;
      var makeApply = require('./lib/apply');
      var _apply = makeApply(Promise, dispatch);
      return {
        lift: lift,
        liftAll: liftAll,
        apply: apply,
        call: call,
        promisify: promisify
      };
      function apply(asyncFunction, extraAsyncArgs) {
        return _apply(asyncFunction, this, extraAsyncArgs || []);
      }
      function dispatch(f, thisArg, args, h) {
        args.push(alwaysUnary(h.resolve, h), alwaysUnary(h.reject, h));
        tryCatchResolve(f, thisArg, args, h);
      }
      function tryCatchResolve(f, thisArg, args, resolver) {
        try {
          f.apply(thisArg, args);
        } catch (e) {
          resolver.reject(e);
        }
      }
      function call(asyncFunction) {
        return _apply(asyncFunction, this, slice.call(arguments, 1));
      }
      function lift(f) {
        var args = arguments.length > 1 ? slice.call(arguments, 1) : [];
        return function() {
          return _apply(f, this, args.concat(slice.call(arguments)));
        };
      }
      function liftAll(src, combine, dst) {
        return _liftAll(lift, combine, dst, src);
      }
      function promisify(asyncFunction, positions) {
        return function() {
          var thisArg = this;
          return Promise.all(arguments).then(function(args) {
            var p = Promise._defer();
            var callbackPos,
                errbackPos;
            if (typeof positions.callback === 'number') {
              callbackPos = normalizePosition(args, positions.callback);
            }
            if (typeof positions.errback === 'number') {
              errbackPos = normalizePosition(args, positions.errback);
            }
            if (errbackPos < callbackPos) {
              insertCallback(args, errbackPos, p._handler.reject, p._handler);
              insertCallback(args, callbackPos, p._handler.resolve, p._handler);
            } else {
              insertCallback(args, callbackPos, p._handler.resolve, p._handler);
              insertCallback(args, errbackPos, p._handler.reject, p._handler);
            }
            asyncFunction.apply(thisArg, args);
            return p;
          });
        };
      }
      function normalizePosition(args, pos) {
        return pos < 0 ? (args.length + pos + 2) : pos;
      }
      function insertCallback(args, pos, callback, thisArg) {
        if (typeof pos === 'number') {
          args.splice(pos, 0, alwaysUnary(callback, thisArg));
        }
      }
      function alwaysUnary(fn, thisArg) {
        return function() {
          if (arguments.length > 1) {
            fn.call(thisArg, slice.call(arguments));
          } else {
            fn.apply(thisArg, arguments);
          }
        };
      }
    });
  })(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  });
})(require('process'));
