/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testRpcCallerDiscloseMe = function(testcase) {
  testcase.expect(1);
  var test = new testutil.Testlog("test/test_rpc_caller_disclose_me.txt");
  var dl = testutil.connect_n(2);
  autobahn.when.all(dl).then(function(res) {
    test.log("all sessions connected");
    var session1 = res[0];
    var session2 = res[1];
    var counter = 0;
    function onTestFinished() {
      session1.leave();
      session2.leave();
      var chk = test.check();
      testcase.ok(!chk, chk);
      testcase.done();
    }
    function case1() {
      test.log("");
      test.log("Case 1: 'session.caller_disclose_me' unset");
      test.log("=============================================");
      var counter = 0;
      function procedure1(args, kwargs, details) {
        var caller_disclosed = details.caller === undefined ? false : true;
        test.log("Caller disclosed:", caller_disclosed);
        counter += 1;
        if (counter === 3) {
          test.log("");
          test.log("");
          case2();
        }
      }
      session1.register("com.myapp.procedure1", procedure1);
      session2.call("com.myapp.procedure1");
      session2.call("com.myapp.procedure1", [], {}, {disclose_me: false});
      session2.call("com.myapp.procedure1", [], {}, {disclose_me: true});
    }
    function case2() {
      test.log("");
      test.log("Case 2: 'session.caller_disclose_me' set to 'false'");
      test.log("======================================================");
      var counter = 0;
      function procedure2(args, kwargs, details) {
        var caller_disclosed = details.caller === undefined ? false : true;
        test.log("Caller disclosed:", caller_disclosed);
        counter += 1;
        if (counter === 3) {
          test.log("");
          test.log("");
          case3();
        }
      }
      session1.register("com.myapp.procedure2", procedure2);
      session2.caller_disclose_me = false;
      session2.call("com.myapp.procedure2");
      session2.call("com.myapp.procedure2", [], {}, {disclose_me: false});
      session2.call("com.myapp.procedure2", [], {}, {disclose_me: true});
    }
    function case3() {
      test.log("");
      test.log("Case 3: 'session.caller_disclose_me' set to 'true'");
      test.log("=====================================================");
      var counter = 0;
      function procedure3(args, kwargs, details) {
        var caller_disclosed = details.caller === undefined ? false : true;
        test.log("Caller disclosed:", caller_disclosed);
        counter += 1;
        if (counter === 3) {
          test.log("");
          test.log("");
          onTestFinished();
        }
      }
      session1.register("com.myapp.procedure3", procedure3);
      session2.caller_disclose_me = true;
      session2.call("com.myapp.procedure3");
      session2.call("com.myapp.procedure3", [], {}, {disclose_me: false});
      session2.call("com.myapp.procedure3", [], {}, {disclose_me: true});
    }
    case1();
  }, function(err) {
    test.log(err);
  });
};
