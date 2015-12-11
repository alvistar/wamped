/* */ 
"format cjs";
(function(define) {
  define(function(require) {
    var when = require('./when');
    var all = when.Promise.all;
    var slice = Array.prototype.slice;
    return function pipeline(tasks) {
      var runTask = function(args, task) {
        runTask = function(arg, task) {
          return task(arg);
        };
        return task.apply(null, args);
      };
      return all(slice.call(arguments, 1)).then(function(args) {
        return when.reduce(tasks, function(arg, task) {
          return runTask(arg, task);
        }, args);
      });
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
