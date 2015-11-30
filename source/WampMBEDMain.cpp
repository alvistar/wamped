#include <iostream>
#include "Wamp.h"
#include "logger.h"
#include "MpackPrinter.h"
#include "mbed-drivers/mbed.h"
#include "WampTransportRaw.h"
#include "WampTransportWS.h"
#include "MsgUnpack.h"
#include "MsgPackCPP.h"

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

int switchColor(int color) {
    static DigitalOut ledBlue(LED_BLUE);
    static DigitalOut ledRed(LED_RED);

    switch (color) {
        case 1:
            ledRed = 0;
            ledBlue =1;
            break;
        default:
            ledRed = 1;
            ledBlue = 0;
    }
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

int sum (int x,int y) {
    return x+y;
}

InterruptIn button(SW2);

void app_start(int, char**) {

    std::cout << "Hello world!\n";

    //wt = new WampTransportRaw {"192.168.20.192"};
    wt = new WampTransportWS {"ws://demo.crossbar.io:8080"};
    wamp = new WampMBED (*wt);

    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        wamp->publish("test", MsgPackArr {"hello"}, MsgPackMap {});

//        wamp->subscribe("com.example.oncounter", [](mpack_node_t &args, mpack_node_t &kwargs) {
//            LOG("Received event: " << MpackPrinter(args).toJSON());
//            blinky();
//        });

        //wamp->registerProcedure("com.freedom.sum",sum);
        wamp->registerProcedure("com.freedom.switch",switchColor);

        wamp->subscribe("com.example.switchon",[](MPNode args, MPNode kwargs) {
        	LOG("Received switchon");
        	switchon();
        });

        wamp->subscribe("com.example.switchoff",[](MPNode args, MPNode kwargs) {
            LOG("Received switchon");
            switchoff();
        });
    });

    button.rise (pressed);

    wamp->onClose = [&]() {
        NVIC_SystemReset();
    };

}
