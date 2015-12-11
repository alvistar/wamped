/* */ 
"format cjs";
(function(process) {
  (function(define) {
    'use strict';
    define(function() {
      return function makePromise(environment) {
        var tasks = environment.scheduler;
        var emitRejection = initEmitRejection();
        var objectCreate = Object.create || function(proto) {
          function Child() {}
          Child.prototype = proto;
          return new Child();
        };
        function Promise(resolver, handler) {
          this._handler = resolver === Handler ? handler : init(resolver);
        }
        function init(resolver) {
          var handler = new Pending();
          try {
            resolver(promiseResolve, promiseReject, promiseNotify);
          } catch (e) {
            promiseReject(e);
          }
          return handler;
          function promiseResolve(x) {
            handler.resolve(x);
          }
          function promiseReject(reason) {
            handler.reject(reason);
          }
          function promiseNotify(x) {
            handler.notify(x);
          }
        }
        Promise.resolve = resolve;
        Promise.reject = reject;
        Promise.never = never;
        Promise._defer = defer;
        Promise._handler = getHandler;
        function resolve(x) {
          return isPromise(x) ? x : new Promise(Handler, new Async(getHandler(x)));
        }
        function reject(x) {
          return new Promise(Handler, new Async(new Rejected(x)));
        }
        function never() {
          return foreverPendingPromise;
        }
        function defer() {
          return new Promise(Handler, new Pending());
        }
        Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
          var parent = this._handler;
          var state = parent.join().state();
          if ((typeof onFulfilled !== 'function' && state > 0) || (typeof onRejected !== 'function' && state < 0)) {
            return new this.constructor(Handler, parent);
          }
          var p = this._beget();
          var child = p._handler;
          parent.chain(child, parent.receiver, onFulfilled, onRejected, onProgress);
          return p;
        };
        Promise.prototype['catch'] = function(onRejected) {
          return this.then(void 0, onRejected);
        };
        Promise.prototype._beget = function() {
          return begetFrom(this._handler, this.constructor);
        };
        function begetFrom(parent, Promise) {
          var child = new Pending(parent.receiver, parent.join().context);
          return new Promise(Handler, child);
        }
        Promise.all = all;
        Promise.race = race;
        Promise._traverse = traverse;
        function all(promises) {
          return traverseWith(snd, null, promises);
        }
        function traverse(f, promises) {
          return traverseWith(tryCatch2, f, promises);
        }
        function traverseWith(tryMap, f, promises) {
          var handler = typeof f === 'function' ? mapAt : settleAt;
          var resolver = new Pending();
          var pending = promises.length >>> 0;
          var results = new Array(pending);
          for (var i = 0,
              x; i < promises.length && !resolver.resolved; ++i) {
            x = promises[i];
            if (x === void 0 && !(i in promises)) {
              --pending;
              continue;
            }
            traverseAt(promises, handler, i, x, resolver);
          }
          if (pending === 0) {
            resolver.become(new Fulfilled(results));
          }
          return new Promise(Handler, resolver);
          function mapAt(i, x, resolver) {
            if (!resolver.resolved) {
              traverseAt(promises, settleAt, i, tryMap(f, x, i), resolver);
            }
          }
          function settleAt(i, x, resolver) {
            results[i] = x;
            if (--pending === 0) {
              resolver.become(new Fulfilled(results));
            }
          }
        }
        function traverseAt(promises, handler, i, x, resolver) {
          if (maybeThenable(x)) {
            var h = getHandlerMaybeThenable(x);
            var s = h.state();
            if (s === 0) {
              h.fold(handler, i, void 0, resolver);
            } else if (s > 0) {
              handler(i, h.value, resolver);
            } else {
              resolver.become(h);
              visitRemaining(promises, i + 1, h);
            }
          } else {
            handler(i, x, resolver);
          }
        }
        Promise._visitRemaining = visitRemaining;
        function visitRemaining(promises, start, handler) {
          for (var i = start; i < promises.length; ++i) {
            markAsHandled(getHandler(promises[i]), handler);
          }
        }
        function markAsHandled(h, handler) {
          if (h === handler) {
            return;
          }
          var s = h.state();
          if (s === 0) {
            h.visit(h, void 0, h._unreport);
          } else if (s < 0) {
            h._unreport();
          }
        }
        function race(promises) {
          if (typeof promises !== 'object' || promises === null) {
            return reject(new TypeError('non-iterable passed to race()'));
          }
          return promises.length === 0 ? never() : promises.length === 1 ? resolve(promises[0]) : runRace(promises);
        }
        function runRace(promises) {
          var resolver = new Pending();
          var i,
              x,
              h;
          for (i = 0; i < promises.length; ++i) {
            x = promises[i];
            if (x === void 0 && !(i in promises)) {
              continue;
            }
            h = getHandler(x);
            if (h.state() !== 0) {
              resolver.become(h);
              visitRemaining(promises, i + 1, h);
              break;
            } else {
              h.visit(resolver, resolver.resolve, resolver.reject);
            }
          }
          return new Promise(Handler, resolver);
        }
        function getHandler(x) {
          if (isPromise(x)) {
            return x._handler.join();
          }
          return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
        }
        function getHandlerMaybeThenable(x) {
          return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
        }
        function getHandlerUntrusted(x) {
          try {
            var untrustedThen = x.then;
            return typeof untrustedThen === 'function' ? new Thenable(untrustedThen, x) : new Fulfilled(x);
          } catch (e) {
            return new Rejected(e);
          }
        }
        function Handler() {}
        Handler.prototype.when = Handler.prototype.become = Handler.prototype.notify = Handler.prototype.fail = Handler.prototype._unreport = Handler.prototype._report = noop;
        Handler.prototype._state = 0;
        Handler.prototype.state = function() {
          return this._state;
        };
        Handler.prototype.join = function() {
          var h = this;
          while (h.handler !== void 0) {
            h = h.handler;
          }
          return h;
        };
        Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
          this.when({
            resolver: to,
            receiver: receiver,
            fulfilled: fulfilled,
            rejected: rejected,
            progress: progress
          });
        };
        Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
          this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
        };
        Handler.prototype.fold = function(f, z, c, to) {
          this.when(new Fold(f, z, c, to));
        };
        function FailIfRejected() {}
        inherit(Handler, FailIfRejected);
        FailIfRejected.prototype.become = function(h) {
          h.fail();
        };
        var failIfRejected = new FailIfRejected();
        function Pending(receiver, inheritedContext) {
          Promise.createContext(this, inheritedContext);
          this.consumers = void 0;
          this.receiver = receiver;
          this.handler = void 0;
          this.resolved = false;
        }
        inherit(Handler, Pending);
        Pending.prototype._state = 0;
        Pending.prototype.resolve = function(x) {
          this.become(getHandler(x));
        };
        Pending.prototype.reject = function(x) {
          if (this.resolved) {
            return;
          }
          this.become(new Rejected(x));
        };
        Pending.prototype.join = function() {
          if (!this.resolved) {
            return this;
          }
          var h = this;
          while (h.handler !== void 0) {
            h = h.handler;
            if (h === this) {
              return this.handler = cycle();
            }
          }
          return h;
        };
        Pending.prototype.run = function() {
          var q = this.consumers;
          var handler = this.handler;
          this.handler = this.handler.join();
          this.consumers = void 0;
          for (var i = 0; i < q.length; ++i) {
            handler.when(q[i]);
          }
        };
        Pending.prototype.become = function(handler) {
          if (this.resolved) {
            return;
          }
          this.resolved = true;
          this.handler = handler;
          if (this.consumers !== void 0) {
            tasks.enqueue(this);
          }
          if (this.context !== void 0) {
            handler._report(this.context);
          }
        };
        Pending.prototype.when = function(continuation) {
          if (this.resolved) {
            tasks.enqueue(new ContinuationTask(continuation, this.handler));
          } else {
            if (this.consumers === void 0) {
              this.consumers = [continuation];
            } else {
              this.consumers.push(continuation);
            }
          }
        };
        Pending.prototype.notify = function(x) {
          if (!this.resolved) {
            tasks.enqueue(new ProgressTask(x, this));
          }
        };
        Pending.prototype.fail = function(context) {
          var c = typeof context === 'undefined' ? this.context : context;
          this.resolved && this.handler.join().fail(c);
        };
        Pending.prototype._report = function(context) {
          this.resolved && this.handler.join()._report(context);
        };
        Pending.prototype._unreport = function() {
          this.resolved && this.handler.join()._unreport();
        };
        function Async(handler) {
          this.handler = handler;
        }
        inherit(Handler, Async);
        Async.prototype.when = function(continuation) {
          tasks.enqueue(new ContinuationTask(continuation, this));
        };
        Async.prototype._report = function(context) {
          this.join()._report(context);
        };
        Async.prototype._unreport = function() {
          this.join()._unreport();
        };
        function Thenable(then, thenable) {
          Pending.call(this);
          tasks.enqueue(new AssimilateTask(then, thenable, this));
        }
        inherit(Pending, Thenable);
        function Fulfilled(x) {
          Promise.createContext(this);
          this.value = x;
        }
        inherit(Handler, Fulfilled);
        Fulfilled.prototype._state = 1;
        Fulfilled.prototype.fold = function(f, z, c, to) {
          runContinuation3(f, z, this, c, to);
        };
        Fulfilled.prototype.when = function(cont) {
          runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
        };
        var errorId = 0;
        function Rejected(x) {
          Promise.createContext(this);
          this.id = ++errorId;
          this.value = x;
          this.handled = false;
          this.reported = false;
          this._report();
        }
        inherit(Handler, Rejected);
        Rejected.prototype._state = -1;
        Rejected.prototype.fold = function(f, z, c, to) {
          to.become(this);
        };
        Rejected.prototype.when = function(cont) {
          if (typeof cont.rejected === 'function') {
            this._unreport();
          }
          runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
        };
        Rejected.prototype._report = function(context) {
          tasks.afterQueue(new ReportTask(this, context));
        };
        Rejected.prototype._unreport = function() {
          if (this.handled) {
            return;
          }
          this.handled = true;
          tasks.afterQueue(new UnreportTask(this));
        };
        Rejected.prototype.fail = function(context) {
          this.reported = true;
          emitRejection('unhandledRejection', this);
          Promise.onFatalRejection(this, context === void 0 ? this.context : context);
        };
        function ReportTask(rejection, context) {
          this.rejection = rejection;
          this.context = context;
        }
        ReportTask.prototype.run = function() {
          if (!this.rejection.handled && !this.rejection.reported) {
            this.rejection.reported = true;
            emitRejection('unhandledRejection', this.rejection) || Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
          }
        };
        function UnreportTask(rejection) {
          this.rejection = rejection;
        }
        UnreportTask.prototype.run = function() {
          if (this.rejection.reported) {
            emitRejection('rejectionHandled', this.rejection) || Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
          }
        };
        Promise.createContext = Promise.enterContext = Promise.exitContext = Promise.onPotentiallyUnhandledRejection = Promise.onPotentiallyUnhandledRejectionHandled = Promise.onFatalRejection = noop;
        var foreverPendingHandler = new Handler();
        var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);
        function cycle() {
          return new Rejected(new TypeError('Promise cycle'));
        }
        function ContinuationTask(continuation, handler) {
          this.continuation = continuation;
          this.handler = handler;
        }
        ContinuationTask.prototype.run = function() {
          this.handler.join().when(this.continuation);
        };
        function ProgressTask(value, handler) {
          this.handler = handler;
          this.value = value;
        }
        ProgressTask.prototype.run = function() {
          var q = this.handler.consumers;
          if (q === void 0) {
            return;
          }
          for (var c,
              i = 0; i < q.length; ++i) {
            c = q[i];
            runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
          }
        };
        function AssimilateTask(then, thenable, resolver) {
          this._then = then;
          this.thenable = thenable;
          this.resolver = resolver;
        }
        AssimilateTask.prototype.run = function() {
          var h = this.resolver;
          tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);
          function _resolve(x) {
            h.resolve(x);
          }
          function _reject(x) {
            h.reject(x);
          }
          function _notify(x) {
            h.notify(x);
          }
        };
        function tryAssimilate(then, thenable, resolve, reject, notify) {
          try {
            then.call(thenable, resolve, reject, notify);
          } catch (e) {
            reject(e);
          }
        }
        function Fold(f, z, c, to) {
          this.f = f;
          this.z = z;
          this.c = c;
          this.to = to;
          this.resolver = failIfRejected;
          this.receiver = this;
        }
        Fold.prototype.fulfilled = function(x) {
          this.f.call(this.c, this.z, x, this.to);
        };
        Fold.prototype.rejected = function(x) {
          this.to.reject(x);
        };
        Fold.prototype.progress = function(x) {
          this.to.notify(x);
        };
        function isPromise(x) {
          return x instanceof Promise;
        }
        function maybeThenable(x) {
          return (typeof x === 'object' || typeof x === 'function') && x !== null;
        }
        function runContinuation1(f, h, receiver, next) {
          if (typeof f !== 'function') {
            return next.become(h);
          }
          Promise.enterContext(h);
          tryCatchReject(f, h.value, receiver, next);
          Promise.exitContext();
        }
        function runContinuation3(f, x, h, receiver, next) {
          if (typeof f !== 'function') {
            return next.become(h);
          }
          Promise.enterContext(h);
          tryCatchReject3(f, x, h.value, receiver, next);
          Promise.exitContext();
        }
        function runNotify(f, x, h, receiver, next) {
          if (typeof f !== 'function') {
            return next.notify(x);
          }
          Promise.enterContext(h);
          tryCatchReturn(f, x, receiver, next);
          Promise.exitContext();
        }
        function tryCatch2(f, a, b) {
          try {
            return f(a, b);
          } catch (e) {
            return reject(e);
          }
        }
        function tryCatchReject(f, x, thisArg, next) {
          try {
            next.become(getHandler(f.call(thisArg, x)));
          } catch (e) {
            next.become(new Rejected(e));
          }
        }
        function tryCatchReject3(f, x, y, thisArg, next) {
          try {
            f.call(thisArg, x, y, next);
          } catch (e) {
            next.become(new Rejected(e));
          }
        }
        function tryCatchReturn(f, x, thisArg, next) {
          try {
            next.notify(f.call(thisArg, x));
          } catch (e) {
            next.notify(e);
          }
        }
        function inherit(Parent, Child) {
          Child.prototype = objectCreate(Parent.prototype);
          Child.prototype.constructor = Child;
        }
        function snd(x, y) {
          return y;
        }
        function noop() {}
        function initEmitRejection() {
          if (typeof process !== 'undefined' && process !== null && typeof process.emit === 'function') {
            return function(type, rejection) {
              return type === 'unhandledRejection' ? process.emit(type, rejection.value, rejection) : process.emit(type, rejection);
            };
          } else if (typeof self !== 'undefined' && typeof CustomEvent === 'function') {
            return (function(noop, self, CustomEvent) {
              var hasCustomEvent = false;
              try {
                var ev = new CustomEvent('unhandledRejection');
                hasCustomEvent = ev instanceof CustomEvent;
              } catch (e) {}
              return !hasCustomEvent ? noop : function(type, rejection) {
                var ev = new CustomEvent(type, {
                  detail: {
                    reason: rejection.value,
                    key: rejection
                  },
                  bubbles: false,
                  cancelable: true
                });
                return !self.dispatchEvent(ev);
              };
            }(noop, self, CustomEvent));
          }
          return noop;
        }
        return Promise;
      };
    });
  }(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory();
  }));
})(require('process'));
