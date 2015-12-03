#include <iostream>
#include "mbed-drivers/mbed.h"
#include "minar/minar.h"
#include "Wamp.h"
#include "WampTransportWS.h"
#include "MsgUnpack.h"
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