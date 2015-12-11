/* */ 
var autobahn = require('../index');
var fs = require('fs');
var config = {
  url: 'ws://127.0.0.1:8080/ws',
  realm: 'realm1'
};
function connect_n(n) {
  var dl = [];
  for (var i = 0; i < n; ++i) {
    (function(idx) {
      var d = autobahn.when.defer();
      var connection = new autobahn.Connection(config);
      connection.onopen = function(session) {
        d.resolve(session);
      };
      connection.open();
      dl.push(d.promise);
    })(i);
  }
  return dl;
}
var Testlog = function(filename) {
  var self = this;
  self._filename = filename;
  self._log = [];
};
Testlog.prototype.log = function() {
  var self = this;
  self._log.push(arguments);
};
Testlog.prototype.stringify = function() {
  var self = this;
  var s = '';
  for (var i = 0; i < self._log.length; ++i) {
    s += i;
    args = self._log[i];
    for (arg in args) {
      s += ' ' + self.stringifyWithOrderedKeys(args[arg]);
    }
    s += "\n";
  }
  return s;
};
Testlog.prototype.stringifyWithOrderedKeys = function(arg) {
  var self = this;
  if (arg != null && typeof(arg) == "object") {
    var clazz = Object.prototype.toString.call(arg).toLowerCase();
    if (clazz.indexOf("array") != -1) {
      var retval = "[";
      for (var i = 0; i < arg.length; i++) {
        if (i > 0)
          retval += ',';
        retval += self.stringifyWithOrderedKeys(arg[i]);
      }
      retval += "]";
      return retval;
    } else {
      var retval = "{";
      var keys = Object.keys(arg).sort();
      for (var i = 0; i < keys.length; i++) {
        if (i > 0)
          retval += ',';
        retval += '"' + keys[i] + '":' + self.stringifyWithOrderedKeys(arg[keys[i]]);
      }
      retval += "}";
      return retval;
    }
  } else {
    return JSON.stringify(arg);
  }
};
Testlog.prototype.check = function() {
  var self = this;
  var slog = self.stringify();
  if (fs.existsSync(self._filename)) {
    var slog_baseline = fs.readFileSync(self._filename);
    if (slog != slog_baseline) {
      return "\nExpected:\n\n" + slog_baseline + "\n\n\nGot:\n\n" + slog + "\n\n";
    } else {
      return null;
    }
  } else {
    fs.writeFileSync(self._filename, slog);
    console.log("Know-good log file created", self._filename, slog.length);
    return null;
  }
};
exports.Testlog = Testlog;
exports.config = config;
exports.connect_n = connect_n;
