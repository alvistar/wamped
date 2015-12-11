/* */ 
var when = require('when');
var session = require('./session');
var util = require('./util');
var log = require('./log');
var autobahn = require('./autobahn');
var Connection = function(options) {
  var self = this;
  self._options = options;
  if (options && options.use_es6_promises) {
    if ('Promise' in global) {
      self._defer = function() {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
          deferred.resolve = resolve;
          deferred.reject = reject;
        });
        return deferred;
      };
    } else {
      log.debug("Warning: ES6 promises requested, but not found! Falling back to whenjs.");
      self._defer = when.defer;
    }
  } else if (options && options.use_deferred) {
    self._defer = options.use_deferred;
  } else {
    self._defer = when.defer;
  }
  if (!self._options.transports) {
    self._options.transports = [{
      type: 'websocket',
      url: self._options.url
    }];
  }
  self._transport_factories = [];
  self._init_transport_factories();
  self._session = null;
  self._session_close_reason = null;
  self._session_close_message = null;
  if (self._options.retry_if_unreachable !== undefined) {
    self._retry_if_unreachable = self._options.retry_if_unreachable;
  } else {
    self._retry_if_unreachable = true;
  }
  self._max_retries = typeof self._options.max_retries !== 'undefined' ? self._options.max_retries : 15;
  self._initial_retry_delay = self._options.initial_retry_delay || 1.5;
  self._max_retry_delay = self._options.max_retry_delay || 300;
  self._retry_delay_growth = self._options.retry_delay_growth || 1.5;
  self._retry_delay_jitter = self._options.retry_delay_jitter || 0.1;
  self._connect_successes = 0;
  self._retry = false;
  self._retry_count = 0;
  self._retry_delay = self._initial_retry_delay;
  self._is_retrying = false;
  self._retry_timer = null;
};
Connection.prototype._create_transport = function() {
  for (var i = 0; i < this._transport_factories.length; ++i) {
    var transport_factory = this._transport_factories[i];
    log.debug("trying to create WAMP transport of type: " + transport_factory.type);
    try {
      var transport = transport_factory.create();
      if (transport) {
        log.debug("using WAMP transport type: " + transport_factory.type);
        return transport;
      }
    } catch (e) {
      log.debug("could not create WAMP transport '" + transport_factory.type + "': " + e);
    }
  }
  return null;
};
Connection.prototype._init_transport_factories = function() {
  var transports,
      transport_options,
      transport_factory,
      transport_factory_klass;
  util.assert(this._options.transports, "No transport.factory specified");
  transports = this._options.transports;
  for (var i = 0; i < this._options.transports.length; ++i) {
    transport_options = this._options.transports[i];
    if (!transport_options.url) {
      transport_options.url = this._options.url;
    }
    if (!transport_options.protocols) {
      transport_options.protocols = this._options.protocols;
    }
    util.assert(transport_options.type, "No transport.type specified");
    util.assert(typeof transport_options.type === "string", "transport.type must be a string");
    try {
      transport_factory_klass = autobahn.transports.get(transport_options.type);
      if (transport_factory_klass) {
        transport_factory = new transport_factory_klass(transport_options);
        this._transport_factories.push(transport_factory);
      }
    } catch (exc) {
      console.error(exc);
    }
  }
};
Connection.prototype._autoreconnect_reset_timer = function() {
  var self = this;
  if (self._retry_timer) {
    clearTimeout(self._retry_timer);
  }
  self._retry_timer = null;
};
Connection.prototype._autoreconnect_reset = function() {
  var self = this;
  self._autoreconnect_reset_timer();
  self._retry_count = 0;
  self._retry_delay = self._initial_retry_delay;
  self._is_retrying = false;
};
Connection.prototype._autoreconnect_advance = function() {
  var self = this;
  if (self._retry_delay_jitter) {
    self._retry_delay = util.rand_normal(self._retry_delay, self._retry_delay * self._retry_delay_jitter);
  }
  if (self._retry_delay > self._max_retry_delay) {
    self._retry_delay = self._max_retry_delay;
  }
  self._retry_count += 1;
  var res;
  if (self._retry && (self._max_retries === -1 || self._retry_count <= self._max_retries)) {
    res = {
      count: self._retry_count,
      delay: self._retry_delay,
      will_retry: true
    };
  } else {
    res = {
      count: null,
      delay: null,
      will_retry: false
    };
  }
  if (self._retry_delay_growth) {
    self._retry_delay = self._retry_delay * self._retry_delay_growth;
  }
  return res;
};
Connection.prototype.open = function() {
  var self = this;
  if (self._transport) {
    throw "connection already open (or opening)";
  }
  self._autoreconnect_reset();
  self._retry = true;
  function retry() {
    self._transport = self._create_transport();
    if (!self._transport) {
      self._retry = false;
      if (self.onclose) {
        var details = {
          reason: null,
          message: null,
          retry_delay: null,
          retry_count: null,
          will_retry: false
        };
        self.onclose("unsupported", details);
      }
      return;
    }
    self._session = new session.Session(self._transport, self._defer, self._options.onchallenge);
    self._session_close_reason = null;
    self._session_close_message = null;
    self._transport.onopen = function() {
      self._autoreconnect_reset();
      self._connect_successes += 1;
      self._session.join(self._options.realm, self._options.authmethods, self._options.authid);
    };
    self._session.onjoin = function(details) {
      if (self.onopen) {
        try {
          self.onopen(self._session, details);
        } catch (e) {
          log.debug("Exception raised from app code while firing Connection.onopen()", e);
        }
      }
    };
    self._session.onleave = function(reason, details) {
      self._session_close_reason = reason;
      self._session_close_message = details.message || "";
      self._retry = false;
      self._transport.close(1000);
    };
    self._transport.onclose = function(evt) {
      self._autoreconnect_reset_timer();
      self._transport = null;
      var reason = null;
      if (self._connect_successes === 0) {
        reason = "unreachable";
        if (!self._retry_if_unreachable) {
          self._retry = false;
        }
      } else if (!evt.wasClean) {
        reason = "lost";
      } else {
        reason = "closed";
      }
      var next_retry = self._autoreconnect_advance();
      if (self.onclose) {
        var details = {
          reason: self._session_close_reason,
          message: self._session_close_message,
          retry_delay: next_retry.delay,
          retry_count: next_retry.count,
          will_retry: next_retry.will_retry
        };
        try {
          var stop_retrying = self.onclose(reason, details);
        } catch (e) {
          log.debug("Exception raised from app code while firing Connection.onclose()", e);
        }
      }
      if (self._session) {
        self._session._id = null;
        self._session = null;
        self._session_close_reason = null;
        self._session_close_message = null;
      }
      if (self._retry && !stop_retrying) {
        if (next_retry.will_retry) {
          self._is_retrying = true;
          log.debug("retrying in " + next_retry.delay + " s");
          self._retry_timer = setTimeout(retry, next_retry.delay * 1000);
        } else {
          log.debug("giving up trying to reconnect");
        }
      }
    };
  }
  retry();
};
Connection.prototype.close = function(reason, message) {
  var self = this;
  if (!self._transport && !self._is_retrying) {
    throw "connection already closed";
  }
  self._retry = false;
  if (self._session && self._session.isOpen) {
    self._session.leave(reason, message);
  } else if (self._transport) {
    self._transport.close(1000);
  }
};
Object.defineProperty(Connection.prototype, "defer", {get: function() {
    return this._defer;
  }});
Object.defineProperty(Connection.prototype, "session", {get: function() {
    return this._session;
  }});
Object.defineProperty(Connection.prototype, "isOpen", {get: function() {
    if (this._session && this._session.isOpen) {
      return true;
    } else {
      return false;
    }
  }});
Object.defineProperty(Connection.prototype, "isConnected", {get: function() {
    if (this._transport) {
      return true;
    } else {
      return false;
    }
  }});
Object.defineProperty(Connection.prototype, "transport", {get: function() {
    if (this._transport) {
      return this._transport;
    } else {
      return {info: {
          type: 'none',
          url: null,
          protocol: null
        }};
    }
  }});
Object.defineProperty(Connection.prototype, "isRetrying", {get: function() {
    return this._is_retrying;
  }});
exports.Connection = Connection;
