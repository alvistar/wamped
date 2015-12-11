/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var when = require('./when');
    return function timeout(msec, trigger) {
      return when(trigger).timeout(msec);
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
