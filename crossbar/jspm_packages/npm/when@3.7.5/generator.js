/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var when = require('./when');
    var slice = Array.prototype.slice;
    var Promise = when.Promise;
    var reject = Promise.reject;
    function lift(generator) {
      return function() {
        return run(generator, this, arguments);
      };
    }
    function call(generator) {
      return run(generator, this, slice.call(arguments, 1));
    }
    function apply(generator, args) {
      return run(generator, this, args || []);
    }
    function run(generator, thisArg, args) {
      return runNext(void 0, generator.apply(thisArg, args));
    }
    function runNext(x, iterator) {
      try {
        return handle(iterator.next(x), iterator);
      } catch (e) {
        return reject(e);
      }
    }
    function next(x) {
      return runNext(x, this);
    }
    function error(e) {
      try {
        return handle(this.throw(e), this);
      } catch (e) {
        return reject(e);
      }
    }
    function handle(result, iterator) {
      if (result.done) {
        return result.value;
      }
      var h = Promise._handler(result.value);
      if (h.state() > 0) {
        return runNext(h.value, iterator);
      }
      var p = Promise._defer();
      h.chain(p._handler, iterator, next, error);
      return p;
    }
    return {
      lift: lift,
      call: call,
      apply: apply
    };
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
