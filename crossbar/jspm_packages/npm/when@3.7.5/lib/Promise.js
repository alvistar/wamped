/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var makePromise = require('./makePromise');
    var Scheduler = require('./Scheduler');
    var async = require('./env').asap;
    return makePromise({scheduler: new Scheduler(async)});
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
