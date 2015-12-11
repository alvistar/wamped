/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    return require('../node');
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
