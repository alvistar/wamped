/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var PromiseMonitor = require('./monitor/PromiseMonitor');
    var ConsoleReporter = require('./monitor/ConsoleReporter');
    var promiseMonitor = new PromiseMonitor(new ConsoleReporter());
    return function(Promise) {
      return promiseMonitor.monitor(Promise);
    };
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
