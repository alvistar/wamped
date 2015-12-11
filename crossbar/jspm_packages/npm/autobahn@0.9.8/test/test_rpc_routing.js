/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testRpcRouting = function(testcase) {
  testcase.expect(3);
  var test = new testutil.Testlog("test/test_rpc_routing.txt");
  var dl = testutil.connect_n(2);
  autobahn.when.all(dl).then(function(res) {
    test.log("all sessions connected");
    var session1 = res[0];
    var session2 = res[1];
    function square(args, kwargs, details) {
      var x = args[0];
      test.log("square() called from session 2", x);
      testcase.ok(details.caller == session2.id);
      return x * x;
    }
    session1.register('com.math.square', square).then(function(res) {
      test.log("square() registered on session 1");
      session2.call('com.math.square', [23], {}, {disclose_me: true}).then(function(res) {
        test.log("result:", res);
        session1.leave();
        session2.leave();
        testcase.ok(res == (23 * 23));
        var chk = test.check();
        testcase.ok(!chk, chk);
        testcase.done();
      });
    });
  }, function(err) {
    test.log(err);
  });
};
