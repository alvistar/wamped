/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var state = require('../state');
    var applier = require('../apply');
    return function array(Promise) {
      var applyFold = applier(Promise);
      var toPromise = Promise.resolve;
      var all = Promise.all;
      var ar = Array.prototype.reduce;
      var arr = Array.prototype.reduceRight;
      var slice = Array.prototype.slice;
      Promise.any = any;
      Promise.some = some;
      Promise.settle = settle;
      Promise.map = map;
      Promise.filter = filter;
      Promise.reduce = reduce;
      Promise.reduceRight = reduceRight;
      Promise.prototype.spread = function(onFulfilled) {
        return this.then(all).then(function(array) {
          return onFulfilled.apply(this, array);
        });
      };
      return Promise;
      function any(promises) {
        var p = Promise._defer();
        var resolver = p._handler;
        var l = promises.length >>> 0;
        var pending = l;
        var errors = [];
        for (var h,
            x,
            i = 0; i < l; ++i) {
          x = promises[i];
          if (x === void 0 && !(i in promises)) {
            --pending;
            continue;
          }
          h = Promise._handler(x);
          if (h.state() > 0) {
            resolver.become(h);
            Promise._visitRemaining(promises, i, h);
            break;
          } else {
            h.visit(resolver, handleFulfill, handleReject);
          }
        }
        if (pending === 0) {
          resolver.reject(new RangeError('any(): array must not be empty'));
        }
        return p;
        function handleFulfill(x) {
          errors = null;
          this.resolve(x);
        }
        function handleReject(e) {
          if (this.resolved) {
            return;
          }
          errors.push(e);
          if (--pending === 0) {
            this.reject(errors);
          }
        }
      }
      function some(promises, n) {
        var p = Promise._defer();
        var resolver = p._handler;
        var results = [];
        var errors = [];
        var l = promises.length >>> 0;
        var nFulfill = 0;
        var nReject;
        var x,
            i;
        for (i = 0; i < l; ++i) {
          x = promises[i];
          if (x === void 0 && !(i in promises)) {
            continue;
          }
          ++nFulfill;
        }
        n = Math.max(n, 0);
        nReject = (nFulfill - n + 1);
        nFulfill = Math.min(n, nFulfill);
        if (n > nFulfill) {
          resolver.reject(new RangeError('some(): array must contain at least ' + n + ' item(s), but had ' + nFulfill));
        } else if (nFulfill === 0) {
          resolver.resolve(results);
        }
        for (i = 0; i < l; ++i) {
          x = promises[i];
          if (x === void 0 && !(i in promises)) {
            continue;
          }
          Promise._handler(x).visit(resolver, fulfill, reject, resolver.notify);
        }
        return p;
        function fulfill(x) {
          if (this.resolved) {
            return;
          }
          results.push(x);
          if (--nFulfill === 0) {
            errors = null;
            this.resolve(results);
          }
        }
        function reject(e) {
          if (this.resolved) {
            return;
          }
          errors.push(e);
          if (--nReject === 0) {
            results = null;
            this.reject(errors);
          }
        }
      }
      function map(promises, f) {
        return Promise._traverse(f, promises);
      }
      function filter(promises, predicate) {
        var a = slice.call(promises);
        return Promise._traverse(predicate, a).then(function(keep) {
          return filterSync(a, keep);
        });
      }
      function filterSync(promises, keep) {
        var l = keep.length;
        var filtered = new Array(l);
        for (var i = 0,
            j = 0; i < l; ++i) {
          if (keep[i]) {
            filtered[j++] = Promise._handler(promises[i]).value;
          }
        }
        filtered.length = j;
        return filtered;
      }
      function settle(promises) {
        return all(promises.map(settleOne));
      }
      function settleOne(p) {
        var h = Promise._handler(p);
        if (h.state() === 0) {
          return toPromise(p).then(state.fulfilled, state.rejected);
        }
        h._unreport();
        return state.inspect(h);
      }
      function reduce(promises, f) {
        return arguments.length > 2 ? ar.call(promises, liftCombine(f), arguments[2]) : ar.call(promises, liftCombine(f));
      }
      function reduceRight(promises, f) {
        return arguments.length > 2 ? arr.call(promises, liftCombine(f), arguments[2]) : arr.call(promises, liftCombine(f));
      }
      function liftCombine(f) {
        return function(z, x, i) {
          return applyFold(f, void 0, [z, x, i]);
        };
      }
    };
  });
}(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
}));
