/* */ 
var autobahn = require('../index');
var testutil = require('./testutil');
exports.testConnect = function(testcase) {
  testcase.expect(1);
  var test = new testutil.Testlog("test/test_connect.txt");
  var N = 10;
  test.log("connecting " + N + " sessions ...");
  var dl = testutil.connect_n(N);
  autobahn.when.all(dl).then(function(res) {
    test.log("all " + res.length + " sessions connected");
    for (var i = 0; i < res.length; ++i) {
      test.log("leaving session " + i);
      res[i].leave();
    }
    var chk = test.check();
    testcase.ok(!chk, chk);
    testcase.done();
  }, function(err) {
    test.log(err);
  });
};
