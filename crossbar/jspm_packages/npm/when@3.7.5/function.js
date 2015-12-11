/* */ 
"format cjs";
(function(process) {
  (function(define) {
    define(function(require) {
      var when = require('./when');
      var attempt = when['try'];
      var _liftAll = require('./lib/liftAll');
      var _apply = require('./lib/apply')(when.Promise);
      var slice = Array.prototype.slice;
      return {
        lift: lift,
        liftAll: liftAll,
        call: attempt,
        apply: apply,
        compose: compose
      };
      function apply(f, args) {
        return _apply(f, this, args == null ? [] : slice.call(args));
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
      function compose(f) {
        var funcs = slice.call(arguments, 1);
        return function() {
          var thisArg = this;
          var args = slice.call(arguments);
          var firstPromise = attempt.apply(thisArg, [f].concat(args));
          return when.reduce(funcs, function(arg, func) {
            return func.call(thisArg, arg);
          }, firstPromise);
        };
      }
    });
  })(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  });
})(require('process'));
