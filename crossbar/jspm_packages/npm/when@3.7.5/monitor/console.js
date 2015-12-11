/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var monitor = require('../monitor');
    var Promise = require('../when').Promise;
    return monitor(Promise);
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
