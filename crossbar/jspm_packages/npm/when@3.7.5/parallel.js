/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var when = require('./when');
    var all = when.Promise.all;
    var slice = Array.prototype.slice;
    return function parallel(tasks) {
      return all(slice.call(arguments, 1)).then(function(args) {
        return when.map(tasks, function(task) {
          return task.apply(void 0, args);
        });
      });
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
