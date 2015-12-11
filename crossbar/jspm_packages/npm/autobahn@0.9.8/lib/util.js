/* */ 
var log = require('./log');
var when = require('when');
var rand_normal = function(mean, sd) {
  var x1,
      x2,
      rad;
  do {
    x1 = 2 * Math.random() - 1;
    x2 = 2 * Math.random() - 1;
    rad = x1 * x1 + x2 * x2;
  } while (rad >= 1 || rad == 0);
  var c = Math.sqrt(-2 * Math.log(rad) / rad);
  return (mean || 0) + (x1 * c) * (sd || 1);
};
var assert = function(cond, text) {
  if (cond) {
    return;
  }
  if (assert.useDebugger || ('AUTOBAHN_DEBUG' in global && AUTOBAHN_DEBUG)) {
    debugger;
  }
  throw new Error(text || "Assertion failed!");
};
var http_post = function(url, data, timeout) {
  log.debug("new http_post request", url, data, timeout);
  var d = when.defer();
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      var status = (req.status === 1223) ? 204 : req.status;
      if (status === 200) {
        d.resolve(req.responseText);
      }
      if (status === 204) {
        d.resolve();
      } else {
        var statusText = null;
        try {
          statusText = req.statusText;
        } catch (e) {}
        d.reject({
          code: status,
          text: statusText
        });
      }
    }
  };
  req.open("POST", url, true);
  req.setRequestHeader("Content-type", "application/json; charset=utf-8");
  if (timeout > 0) {
    req.timeout = timeout;
    req.ontimeout = function() {
      d.reject({
        code: 501,
        text: "request timeout"
      });
    };
  }
  if (data) {
    req.send(data);
  } else {
    req.send();
  }
  if (d.promise.then) {
    return d.promise;
  } else {
    return d;
  }
};
var defaults = function() {
  if (arguments.length === 0)
    return {};
  var base = arguments[0];
  var recursive = false;
  var len = arguments.length;
  if (typeof arguments[len - 1] === 'boolean') {
    recursive = arguments[len - 1];
    len -= 1;
  }
  var do_merge = function(key) {
    var val = obj[key];
    if (!(key in base)) {
      base[key] = val;
    } else if (recursive && typeof val === 'object' && typeof base[key] === 'object') {
      defaults(base[key], val);
    }
  };
  for (var i = 1; i < len; i++) {
    var obj = arguments[i];
    if (!obj)
      continue;
    if (typeof obj !== 'object') {
      throw new Error('Expected argument at index ' + i + ' to be an object');
    }
    Object.keys(obj).forEach(do_merge);
  }
  return base;
};
exports.rand_normal = rand_normal;
exports.assert = assert;
exports.http_post = http_post;
exports.defaults = defaults;
