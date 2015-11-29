#include <iostream>
#include "WampMBED.h"
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

        wamp->subscribe("com.example.oncounter", [](mpack_node_t &args, mpack_node_t &kwargs) {
            LOG("Received event: " << MpackPrinter(args).toJSON());
        });
    });



    while (true) {
        wt->process();
    }

}