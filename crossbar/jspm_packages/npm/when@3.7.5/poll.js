/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var when = require('./when');
    var attempt = when['try'];
    var cancelable = require('./cancelable');
    return function poll(task, interval, verifier, delayInitialTask) {
      var deferred,
          canceled,
          reject;
      canceled = false;
      deferred = cancelable(when.defer(), function() {
        canceled = true;
      });
      reject = deferred.reject;
      verifier = verifier || function() {
        return false;
      };
      if (typeof interval !== 'function') {
        interval = (function(interval) {
          return function() {
            return when().delay(interval);
          };
        })(interval);
      }
      function certify(result) {
        deferred.resolve(result);
      }
      function schedule(result) {
        attempt(interval).then(vote, reject);
        if (result !== void 0) {
          deferred.notify(result);
        }
      }
      function vote() {
        if (canceled) {
          return;
        }
        when(task(), function(result) {
          when(verifier(result), function(verification) {
            return verification ? certify(result) : schedule(result);
          }, function() {
            schedule(result);
          });
        }, reject);
      }
      if (delayInitialTask) {
        schedule();
      } else {
        vote();
      }
      deferred.promise = Object.create(deferred.promise);
      deferred.promise.cancel = deferred.cancel;
      return deferred.promise;
    };
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
