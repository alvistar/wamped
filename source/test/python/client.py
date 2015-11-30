from autobahn.twisted.wamp import ApplicationSession
from autobahn.twisted.wamp import ApplicationRunner
from twisted.internet.defer import inlineCallbacks

class MyComponent(ApplicationSession):
    @inlineCallbacks
    def onJoin(self, details):
        print("Session Ready")
        try:
            # res = yield self.call("com.freedom.sum", 100)
            # print (res)
            res = yield self.call("com.freedom.switch", 1)
            print (res)
        except Exception as e:
            print("call error: {0}".format(e))


runner = ApplicationRunner(url=u"wss://demo.crossbar.io/ws", realm=u"realm1")
runner.run(MyComponent)