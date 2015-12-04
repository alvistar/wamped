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
#include "mbed-drivers/mbed.h"
#include "minar/minar.h"
#include "Wamp.h"
#include "WampTransportWS.h"
#include "mpackCPP/MsgUnpack.h"
#include "logger.h"

WampTransportWS *wt;
Wamp *wamp;


//DigitalOut cled {LED_BLUE,1};

static void blinky(void) {
    static DigitalOut led(LED1);
    led = !led;
}

void app_start(int, char**) {

    std::cout << "Hello world!\n";

    wt = new WampTransportWS {"ws://demo.crossbar.io:8080"};
    wamp = new Wamp (*wt);

    wamp->onClose = [&]() {
        NVIC_SystemReset();
    };

    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        wamp->pub("com.freedom.welcome", "hello");

        wamp->subscribe("com.freedom.oncounter", [](MPNode args, MPNode kwargs) {
            LOG("Received event: " << args);
            blinky();
        });
    });
};