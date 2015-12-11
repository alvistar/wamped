/* */ 
"format cjs";
(function(process) {
  (function(define) {
    define(function(require) {
      var when = require('./when');
      var _liftAll = require('./lib/liftAll');
      var setTimer = require('./lib/env').setTimer;
      var slice = Array.prototype.slice;
      var _apply = require('./lib/apply')(when.Promise, dispatch);
      return {
        lift: lift,
        liftAll: liftAll,
        apply: apply,
        call: call,
        createCallback: createCallback,
        bindCallback: bindCallback,
        liftCallback: liftCallback
      };
      function apply(f, args) {
        return _apply(f, this, args || []);
      }
      function dispatch(f, thisArg, args, h) {
        var cb = createCallback(h);
        try {
          switch (args.length) {
            case 2:
              f.call(thisArg, args[0], args[1], cb);
              break;
            case 1:
              f.call(thisArg, args[0], cb);
              break;
            case 0:
              f.call(thisArg, cb);
              break;
            default:
              args.push(cb);
              f.apply(thisArg, args);
          }
        } catch (e) {
          h.reject(e);
        }
      }
      function call(f) {
        return _apply(f, this, slice.call(arguments, 1));
      }
      function lift(f) {
        var args1 = arguments.length > 1 ? slice.call(arguments, 1) : [];
        return function() {
          var l = args1.length;
          var al = arguments.length;
          var args = new Array(al + l);
          var i;
          for (i = 0; i < l; ++i) {
            args[i] = args1[i];
          }
          for (i = 0; i < al; ++i) {
            args[i + l] = arguments[i];
          }
          return _apply(f, this, args);
        };
      }
      function liftAll(src, combine, dst) {
        return _liftAll(lift, combine, dst, src);
      }
      function createCallback(resolver) {
        return function(err, value) {
          if (err) {
            resolver.reject(err);
          } else if (arguments.length > 2) {
            resolver.resolve(slice.call(arguments, 1));
          } else {
            resolver.resolve(value);
          }
        };
      }
      function bindCallback(promise, callback) {
        promise = when(promise);
        if (callback) {
          promise.then(success, wrapped);
        }
        return promise;
        function success(value) {
          wrapped(null, value);
        }
        function wrapped(err, value) {
          setTimer(function() {
            callback(err, value);
          }, 0);
        }
      }
      function liftCallback(callback) {
        return function(promise) {
          return bindCallback(promise, callback);
        };
      }
    });
  })(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  });
})(require('process'));
