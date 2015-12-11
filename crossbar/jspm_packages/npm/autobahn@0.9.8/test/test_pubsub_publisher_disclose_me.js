/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testPubsubPublisherDiscloseMe = function(testcase) {
  testcase.expect(1);
  var test = new testutil.Testlog("test/test_pubsub_publisher_disclose_me.txt");
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
      test.log("Case 1: 'session.publisher_disclose_me' unset");
      test.log("=============================================");
      var counter = 0;
      function onevent1(args, kwargs, details) {
        var publisher_disclosed = details.publisher === undefined ? false : true;
        test.log("Publisher disclosed:", publisher_disclosed);
        counter += 1;
        if (counter === 3) {
          test.log("");
          test.log("");
          case2();
        }
      }
      session1.subscribe("com.myapp.topic1", onevent1);
      session2.publish("com.myapp.topic1");
      session2.publish("com.myapp.topic1", [], {}, {disclose_me: false});
      session2.publish("com.myapp.topic1", [], {}, {disclose_me: true});
    }
    function case2() {
      test.log("");
      test.log("Case 2: 'session.publisher_disclose_me' set to 'false'");
      test.log("======================================================");
      var counter = 0;
      function onevent2(args, kwargs, details) {
        var publisher_disclosed = details.publisher === undefined ? false : true;
        test.log("Publisher disclosed:", publisher_disclosed);
        counter += 1;
        if (counter === 3) {
          test.log("");
          test.log("");
          case3();
        }
      }
      session1.subscribe("com.myapp.topic2", onevent2);
      session2.publisher_disclose_me = false;
      session2.publish("com.myapp.topic2");
      session2.publish("com.myapp.topic2", [], {}, {disclose_me: false});
      session2.publish("com.myapp.topic2", [], {}, {disclose_me: true});
    }
    function case3() {
      test.log("");
      test.log("Case 3: 'session.publisher_disclose_me' set to 'true'");
      test.log("=====================================================");
      var counter = 0;
      function onevent3(args, kwargs, details) {
        var publisher_disclosed = details.publisher === undefined ? false : true;
        test.log("Publisher disclosed:", publisher_disclosed);
        counter += 1;
        if (counter === 3) {
          test.log("");
          test.log("");
          onTestFinished();
        }
      }
      session1.subscribe("com.myapp.topic3", onevent3);
      session2.publisher_disclose_me = true;
      session2.publish("com.myapp.topic3");
      session2.publish("com.myapp.topic3", [], {}, {disclose_me: false});
      session2.publish("com.myapp.topic3", [], {}, {disclose_me: true});
    }
    case1();
  }, function(err) {
    test.log(err);
  });
};
