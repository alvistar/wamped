//Copyright 2015 Alessandro Viganò https://github.com/alvistar
//
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//        limitations under the License.

#include <iostream>
#include "Wamp.h"
#include "WampTransportRaw.h"
#include "WampTransportWS.h"
#include "MsgUnpack.h"
#include <unistd.h>

#include "logger.h"



//WampTransportRaw *wt;
WampTransportWS *wt;
Wamp *wamp;

void onConnect() {

}

void empty() {
    LOG("Called empty");
}

uint16_t getCounter() {
    return 42;
}

int sum(int x, int y) {
    return x+y;
}


int main() {

    std::cout << "Hello world!\n";

    //wt = new WampTransportRaw {"localhost"};
    wt = new WampTransportWS {"ws://demo.crossbar.io:8080"};
    wamp = new Wamp (*wt);

    wamp->onClose = ([&]() {
        LOG("Reconnecting");
        sleep(1);
        wamp->connect();
    });

    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        wamp->pub("test", "hello");

        wamp->subscribe("com.example.oncounter", [](MPNode args, MPNode kwargs) {
            (void) kwargs;
            LOG("Received event: " << args);
        });

        wamp->registerProcedure("com.mydevice.sum", sum, [](URI err) {
            if (!err.empty()) {
                LOG("REGISTRATION ERROR:" << err);
            }
            LOG("Registration OK");
        });

        wamp->registerProcedure("com.freedom.getCounter", empty);

        wamp->call("com.example.add", MsgPackArr {20,3}, MsgPackMap{},
                   [](URI err, MPNode args, MPNode kwargs) {
                       (void) kwargs;
                   if (!err.empty()) {
                LOG("Received result:" << args);
            }

        });

    });



    while (true) {
        wt->process();
    }

}