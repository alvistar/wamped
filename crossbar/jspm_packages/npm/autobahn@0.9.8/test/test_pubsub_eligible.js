/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testPubsubEligible = function(testcase) {
  testcase.expect(4);
  var test = new testutil.Testlog("test/test_pubsub_eligible.txt");
  var dl = testutil.connect_n(3);
  var delay = 100;
  autobahn.when.all(dl).then(function(res) {
    test.log("all sessions connected");
    var session1 = res[0];
    var session2 = res[1];
    var session3 = res[2];
    function onTestFinished() {
      session1.leave();
      session2.leave();
      session3.leave();
      var chk = test.check();
      testcase.ok(!chk, chk);
      testcase.done();
    }
    function case1() {
      test.log("");
      test.log("Case 1: 'eligible' unset");
      test.log("===========================");
      var counter = 0;
      var t1 = setInterval(function() {
        session1.publish('com.myapp.topic1', [counter]);
        counter += 1;
      }, delay);
      var received2 = 0;
      var received3 = 0;
      var session2Finished = autobahn.when.defer();
      var session3Finished = autobahn.when.defer();
      var testLog2 = [];
      var testLog3 = [];
      function onevent2(args) {
        testLog2.push("Session 2 got event: " + args[0]);
        received2 += 1;
        if (received2 > 5) {
          session2Finished.resolve(true);
        }
      }
      function onevent3(args) {
        testLog3.push("Session 3 got event: " + args[0]);
        received3 += 1;
        if (received3 > 5) {
          session3Finished.resolve(true);
        }
      }
      autobahn.when.all([session2Finished.promise, session3Finished.promise]).then(function() {
        clearInterval(t1);
        testcase.ok(true, "Case 1: Both clients received events");
        var logs = [testLog2, testLog3];
        logs.forEach(function(log) {
          test.log("-----------");
          log.forEach(function(line) {
            test.log(line);
          });
          test.log("----------");
        });
        case2();
      });
      session2.subscribe('com.myapp.topic1', onevent2);
      session3.subscribe('com.myapp.topic1', onevent3);
    }
    function case2() {
      test.log("");
      test.log("Case 2: 'eligible' session3 ");
      test.log("===========================");
      var counter = 0;
      var t2 = setInterval(function() {
        session1.publish('com.myapp.topic2', [counter], {}, {eligible: [session3.id]});
        counter += 1;
      }, delay);
      var received3 = 0;
      var session2Received = false;
      function onevent2(args) {
        session2Received = true;
        test.log("Session 2 got event even though it should have been excluded.");
      }
      function onevent3(args) {
        test.log("Session 3 got event:", args[0]);
        received3 += 1;
        if (received3 > 5) {
          test.log("");
          test.log("");
          test.log("");
          clearInterval(t2);
          if (!session2Received) {
            testcase.ok(true, "Case 2: Session 2 did not receive any events!");
          } else {
            testcase.ok(false, "Case 2: Session 2 received one or more events!");
          }
          case3();
        }
      }
      session2.subscribe('com.myapp.topic2', onevent2);
      session3.subscribe('com.myapp.topic2', onevent3);
    }
    function case3() {
      test.log("");
      test.log("Case 3: 'eligible' session 2 + session 3");
      test.log("===========================");
      var counter = 0;
      var t1 = setInterval(function() {
        session1.publish('com.myapp.topic3', [counter], {}, {eligible: [session2.id, session3.id]});
        counter += 1;
      }, delay);
      var received2 = 0;
      var received3 = 0;
      var session2Finished = autobahn.when.defer();
      var session3Finished = autobahn.when.defer();
      var testLog2 = [];
      var testLog3 = [];
      function onevent2(args) {
        testLog2.push("Session 2 got event: " + args[0]);
        received2 += 1;
        if (received2 > 5) {
          session2Finished.resolve(true);
        }
      }
      function onevent3(args) {
        testLog3.push("Session 3 got event: " + args[0]);
        received3 += 1;
        if (received3 > 5) {
          session3Finished.resolve(true);
        }
      }
      autobahn.when.all([session2Finished.promise, session3Finished.promise]).then(function() {
        clearInterval(t1);
        testcase.ok(true, "Case 3: Both clients received events");
        var logs = [testLog2, testLog3];
        logs.forEach(function(log) {
          test.log("-----------");
          log.forEach(function(line) {
            test.log(line);
          });
          test.log("----------");
        });
        onTestFinished();
      });
      session2.subscribe('com.myapp.topic3', onevent2);
      session3.subscribe('com.myapp.topic3', onevent3);
    }
    case1();
  }, function(err) {
    console.log("connections failed");
    test.log(err);
  });
};
