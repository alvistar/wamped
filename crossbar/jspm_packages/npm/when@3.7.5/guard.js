/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var when = require('./when');
    var slice = Array.prototype.slice;
    guard.n = n;
    return guard;
    function guard(condition, f) {
      return function() {
        var args = slice.call(arguments);
        return when(condition()).withThis(this).then(function(exit) {
          return when(f.apply(this, args))['finally'](exit);
        });
      };
    }
    function n(allowed) {
      var count = 0;
      var waiting = [];
      return function enter() {
        return when.promise(function(resolve) {
          if (count < allowed) {
            resolve(exit);
          } else {
            waiting.push(resolve);
          }
          count += 1;
        });
      };
      function exit() {
        count = Math.max(count - 1, 0);
        if (waiting.length > 0) {
          waiting.shift()(exit);
        }
      }
    }
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
