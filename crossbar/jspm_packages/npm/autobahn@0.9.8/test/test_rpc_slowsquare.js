/* */ 
(function(process) {
  var autobahn = require('../index');
  var testutil = require('./testutil');
  exports.testRpcSlowsquare = function(testcase) {
    testcase.expect(1);
    var test = new testutil.Testlog("test/test_rpc_slowsquare.txt");
    var connection = new autobahn.Connection(testutil.config);
    connection.onopen = function(session) {
      test.log('Connected');
      function square(x) {
        return x * x;
      }
      function slowsquare(x) {
        var d = autobahn.when.defer();
        setTimeout(function() {
          d.resolve(x * x);
        }, 500);
        return d.promise;
      }
      var endpoints = {
        'com.math.square': square,
        'com.math.slowsquare': slowsquare
      };
      var pl1 = [];
      for (var uri in endpoints) {
        pl1.push(session.register(uri, endpoints[uri]));
      }
      autobahn.when.all(pl1).then(function() {
        test.log("All registered.");
        var pl2 = [];
        var t1 = process.hrtime();
        pl2.push(session.call('com.math.slowsquare', [3]).then(function(res) {
          var duration = process.hrtime(t1);
          test.log("Slow Square:", res);
        }, function(err) {
          test.log("Error", err);
        }));
        var t2 = process.hrtime();
        pl2.push(session.call('com.math.square', [3]).then(function(res) {
          var duration = process.hrtime(t2);
          test.log("Quick Square:", res);
        }, function(err) {
          test.log("Error", err);
        }));
        autobahn.when.all(pl2).then(function() {
          test.log("All finished.");
          connection.close();
          var chk = test.check();
          testcase.ok(!chk, chk);
          testcase.done();
        });
      }, function() {
        test.log("Registration failed!", arguments);
      });
    };
    connection.open();
  };
})(require('process'));
