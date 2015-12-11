/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var inspect = require('../state').inspect;
    return function inspection(Promise) {
      Promise.prototype.inspect = function() {
        return inspect(Promise._handler(this));
      };
      return Promise;
    };
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
