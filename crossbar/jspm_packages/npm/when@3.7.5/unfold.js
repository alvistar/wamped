/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    return require('./when').unfold;
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
