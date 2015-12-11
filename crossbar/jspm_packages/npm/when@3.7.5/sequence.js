/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var when = require('./when');
    var all = when.Promise.all;
    var slice = Array.prototype.slice;
    return function sequence(tasks) {
      var results = [];
      return all(slice.call(arguments, 1)).then(function(args) {
        return when.reduce(tasks, function(results, task) {
          return when(task.apply(void 0, args), addResult);
        }, results);
      });
      function addResult(result) {
        results.push(result);
        return results;
      }
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
