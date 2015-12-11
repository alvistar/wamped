/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testRpcOptions = function(testcase) {
  testcase.expect(1);
  var test = new testutil.Testlog("test/test_rpc_options.txt");
  var connection = new autobahn.Connection(testutil.config);
  connection.onopen = function(session) {
    test.log('Connected');
    function square(args, kwargs, details) {
      if (details && details.caller) {
        details.caller -= session.id;
      }
      test.log("Someone is calling me;)", details);
      var val = args[0];
      if (val < 0) {
        session.publish('com.myapp.square_on_nonpositive', [val]);
      } else if (val === 0) {
        var options = {};
        if (details && details.caller) {
          options = {exclude: [details.caller]};
        }
        session.publish('com.myapp.square_on_nonpositive', [val], {}, options);
      }
      return args[0] * args[0];
    }
    var endpoints = {'com.myapp.square': square};
    var pl1 = [];
    for (var uri in endpoints) {
      pl1.push(session.register(uri, endpoints[uri]));
    }
    autobahn.when.all(pl1).then(function() {
      test.log("All registered.");
      function on_event(val) {
        test.log("Someone requested to square non-positive:", val);
      }
      session.subscribe('com.myapp.square_on_nonpositive', on_event);
      var pl2 = [];
      var vals = [2, 0, -2];
      for (var i = 0; i < vals.length; ++i) {
        pl2.push(session.call('com.myapp.square', [vals[i]], {}, {disclose_me: true}).then(function(res) {
          test.log("Squared", res);
        }, function(error) {
          test.log("Call failed:", error);
        }));
      }
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
