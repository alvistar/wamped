#include <iostream>
#include "Wamp.h"
#include "logger.h"
#include "MpackPrinter.h"
#include "WampTransportRaw.h"
#include "WampTransportWS.h"
#include "MsgUnpack.h"

//WampTransportRaw *wt;
WampTransportWS *wt;
WampMBED *wamp;

void onConnect() {

}


int main() {

    std::cout << "Hello world!\n";

    //wt = new WampTransportRaw {"localhost"};
    wt = new WampTransportWS {"ws://localhost:8081"};
    wamp = new WampMBED (*wt);

    wamp->onClose = ([&]() {
        LOG("Reconnecting");
        sleep(1);
        wamp->connect();
    });

    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        wamp->publish("test", MsgPackArr {"hello"}, MsgPackMap {});

        wamp->subscribe("com.example.oncounter", [](MPNode args, MPNode kwargs) {
            (void) kwargs;
            LOG("Received event: " << args.toJson());
        });

        wamp->call("com.example.add", MsgPackArr {20,3}, MsgPackMap{},
                   [](WampError *err, MPNode args, MPNode kwargs) {
            if (!err) {
                LOG("Received result:" << args.toJson());
            }

        });

    });



    while (true) {
        wt->process();
    }

}