/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var unfold = require('../when').unfold;
    return function list(generator, condition, seed) {
      var result = [];
      return unfold(generator, condition, append, seed)['yield'](result);
      function append(value, newSeed) {
        result.push(value);
        return newSeed;
      }
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
