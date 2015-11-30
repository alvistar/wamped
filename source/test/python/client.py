from autobahn.twisted.wamp import ApplicationSession
from autobahn.twisted.wamp import ApplicationRunner
from twisted.internet.defer import inlineCallbacks

class MyComponent(ApplicationSession):
    @inlineCallbacks
    def onJoin(self, details):
        print("Session Ready")
        try:
            res = yield self.call("com.mydevice.sum", 100,"came", timeout= 3)
            print (res);
        except Exception as e:
            print("call error: {0}".format(e))

runner = ApplicationRunner(url=u"ws://localhost:8081", realm=u"realm1")
runner.run(MyComponent)