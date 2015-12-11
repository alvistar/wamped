/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var when = require('./when');
    return function delay(msec, value) {
      return when(value).delay(msec);
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
