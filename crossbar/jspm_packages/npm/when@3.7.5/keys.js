/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var when = require('./when');
    var Promise = when.Promise;
    var toPromise = when.resolve;
    return {
      all: when.lift(all),
      map: map,
      settle: settle
    };
    function all(object) {
      var p = Promise._defer();
      var resolver = Promise._handler(p);
      var results = {};
      var keys = Object.keys(object);
      var pending = keys.length;
      for (var i = 0,
          k; i < keys.length; ++i) {
        k = keys[i];
        Promise._handler(object[k]).fold(settleKey, k, results, resolver);
      }
      if (pending === 0) {
        resolver.resolve(results);
      }
      return p;
      function settleKey(k, x, resolver) {
        this[k] = x;
        if (--pending === 0) {
          resolver.resolve(results);
        }
      }
    }
    function map(object, f) {
      return toPromise(object).then(function(object) {
        return all(Object.keys(object).reduce(function(o, k) {
          o[k] = toPromise(object[k]).fold(mapWithKey, k);
          return o;
        }, {}));
      });
      function mapWithKey(k, x) {
        return f(x, k);
      }
    }
    function settle(object) {
      var keys = Object.keys(object);
      var results = {};
      if (keys.length === 0) {
        return toPromise(results);
      }
      var p = Promise._defer();
      var resolver = Promise._handler(p);
      var promises = keys.map(function(k) {
        return object[k];
      });
      when.settle(promises).then(function(states) {
        populateResults(keys, states, results, resolver);
      });
      return p;
    }
    function populateResults(keys, states, results, resolver) {
      for (var i = 0; i < keys.length; i++) {
        results[keys[i]] = states[i];
      }
      resolver.resolve(results);
    }
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
