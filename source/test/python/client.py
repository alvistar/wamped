from autobahn.twisted.wamp import ApplicationSession
from autobahn.twisted.wamp import ApplicationRunner
from autobahn.twisted.util import sleep
from twisted.internet.defer import inlineCallbacks

def onMsg(args):
    print("Received message {0}".format(args))

class MyComponent(ApplicationSession):
    print("Session Ready")
    @inlineCallbacks
    def onJoin(self, details):
        self.subscribe(onMsg, "com.freedom.welcome")

        counter = 0

        while True:
            # PUBLISH an event
            #
            yield self.publish('com.freedom.oncounter', counter)
            print("published to 'oncounter' with counter {}".format(counter))
            counter += 1
            yield sleep(1)


runner = ApplicationRunner(url=u"wss://demo.crossbar.io/ws", realm=u"realm1")
runner.run(MyComponent)