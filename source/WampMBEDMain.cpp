#include <iostream>
#include "WampMBED.h"
#include "logger.h"
#include "MpackPrinter.h"
#include "mbed-drivers/mbed.h"
#include "WampTransportRaw.h"
#include "WampTransportWS.h"

//WampTransportRaw *wt;
WampTransportWS *wt;
WampMBED *wamp;

static void blinky(void) {
    static DigitalOut led(LED1);
    led = !led;
}

static void switchon(void) {
	static DigitalOut led(LED_BLUE);
	led = 0;
}

static void switchoff(void) {
    static DigitalOut led(LED_BLUE);
    led = 1;
}

static void pressed() {
//    MsgPack args;

//    args.pack_array(1);
//    args.pack("pressed");

//    MsgPack kwargs;
//    args.pack_map(0);
//
    LOG("Publishing pressed event");
//    wamp->publish("button");

    wamp->publish("button");

}

InterruptIn button(SW2);

void app_start(int, char**) {

    std::cout << "Hello world!\n";

    //wt = new WampTransportRaw {"192.168.20.192"};
    wt = new WampTransportWS {"ws://192.168.20.192:8081"};
    wamp = new WampMBED (*wt);

    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        wamp->publish("test", MsgPackArr {"hello"}, MsgPackMap {});

//        wamp->subscribe("com.example.oncounter", [](mpack_node_t &args, mpack_node_t &kwargs) {
//            LOG("Received event: " << MpackPrinter(args).toJSON());
//            blinky();
//        });

        wamp->subscribe("com.example.switchon",[](mpack_node_t &args, mpack_node_t &kwargs) {
        	LOG("Received switchon");
        	switchon();
        });

        wamp->subscribe("com.example.switchoff",[](mpack_node_t &args, mpack_node_t &kwargs) {
            LOG("Received switchon");
            switchoff();
        });
    });

    button.rise (pressed);

    wamp->onClose = [&]() {
        //NVIC_SystemReset();
    };

}
