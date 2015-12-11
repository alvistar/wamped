/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testPubsubExcludeMe = function(testcase) {
  testcase.expect(4);
  var test = new testutil.Testlog("test/test_pubsub_excludeme.txt");
  var dl = testutil.connect_n(2);
  var delay = 100;
  autobahn.when.all(dl).then(function(res) {
    test.log("all sessions connected");
    var session1 = res[0];
    var session2 = res[1];
    function onTestFinished() {
      test.log("");
      test.log("Finished.");
      session1.leave();
      session2.leave();
      var chk = test.check();
      testcase.ok(!chk, chk);
      testcase.done();
    }
    function case1() {
      test.log("");
      test.log("Case 1: 'exclude_me' unset");
      test.log("===========================");
      var counter = 0;
      var t1 = setInterval(function() {
        session1.publish('com.myapp.topic1', [counter]);
        counter += 1;
      }, delay);
      var received = 0;
      var session1Received = false;
      function onevent1(args) {
        test.log("Session 1 got event even though it should have been excluded.");
        session1Received = true;
      }
      function onevent2(args) {
        test.log("Session 2 got event:", args[0]);
        received += 1;
        if (received > 5) {
          test.log("");
          clearInterval(t1);
          if (session1Received === false) {
            testcase.ok(true, "Case 1: Publisher did not receive any events!");
          } else {
            testcase.ok(false, "Case 1: Publisher received one or more events!");
          }
          case2();
        }
      }
      session1.subscribe('com.myapp.topic1', onevent1);
      session2.subscribe('com.myapp.topic1', onevent2);
    }
    function case2() {
      test.log("");
      test.log("Case 2: 'exclude_me: true' ");
      test.log("===========================");
      var counter = 0;
      var t2 = setInterval(function() {
        session1.publish('com.myapp.topic2', [counter], {}, {exclude_me: true});
        counter += 1;
      }, delay);
      var received = 0;
      var session1Received = false;
      function onevent1(args) {
        session1Received = true;
        test.log("Session 1 got event even though it should have been excluded.");
      }
      function onevent2(args) {
        test.log("Session 2 got event:", args[0]);
        received += 1;
        if (received > 5) {
          test.log("");
          clearInterval(t2);
          if (!session1Received) {
            testcase.ok(true, "Case 2: Publisher did not receive any events!");
          } else {
            testcase.ok(false, "Case 2: Publisher received one or more events!");
          }
          case3();
        }
      }
      session1.subscribe('com.myapp.topic2', onevent1);
      session2.subscribe('com.myapp.topic2', onevent2);
    }
    function case3() {
      test.log("");
      test.log("Case 3: 'exclude_me: false' ");
      test.log("===========================");
      var counter = 0;
      var t3 = setInterval(function() {
        session1.publish('com.myapp.topic3', [counter], {}, {exclude_me: false});
        counter += 1;
      }, delay);
      var received1 = 0;
      var received2 = 0;
      var session1Finished = autobahn.when.defer();
      var session2Finished = autobahn.when.defer();
      var testLog1 = [];
      var testLog2 = [];
      function onevent1(args) {
        testLog1.push("Session 1 got event: " + args[0]);
        received1 += 1;
        if (received1 > 5) {
          session1Finished.resolve(true);
        }
      }
      function onevent2(args) {
        testLog2.push("Session 2 got event: " + args[0]);
        received2 += 1;
        if (received2 > 5) {
          session2Finished.resolve(true);
        }
      }
      autobahn.when.all([session1Finished.promise, session2Finished.promise]).then(function() {
        clearInterval(t3);
        testcase.ok(true, "Case 3: Both clients received events");
        var logs = [testLog1, testLog2];
        logs.forEach(function(log) {
          test.log("");
          log.forEach(function(line) {
            test.log(line);
          });
        });
        onTestFinished();
      });
      session1.subscribe('com.myapp.topic3', onevent1);
      session2.subscribe('com.myapp.topic3', onevent2);
    }
    case1();
  }, function(err) {
    console.log("connections failed");
    test.log(err);
  });
};
