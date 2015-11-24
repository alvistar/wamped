#include <iostream>
#include "WampMBED.h"
#include "logger.h"
#include "MpackPrinter.h"

#ifdef YOTTA_CFG_MBED
#include "mbed-drivers/mbed.h"
#include "WampTransportRawMBED.h"

#else //YOTTA_CFG_MBED
#include "WampTransportRaw.h"
#include "MsgUnpack.h"


#endif //YOTTA_CFG_MBED

WampTransportRaw *wt;
WampMBED *wamp;

static void blinky(void) {
#ifdef YOTTA_CFG_MBED
    static DigitalOut led(LED1);
    led = !led;
    //printf("LED = %d \r\n",led.read());
#endif
}

#ifdef YOTTA_CFG_MBED
static void pressed() {
    MsgPack args;

    args.pack_array(1);
    args.pack("pressed");

    MsgPack kwargs;
    args.pack_map(0);

    LOG("Publishing pressed event");
    wamp->publish("button", args, kwargs);

}
#endif

#ifdef YOTTA_CFG_MBED
InterruptIn button(SW2);

void app_start(int, char**) {
#else //YOTTA_CFG_MBED
int main() {
#endif //YOTTA_CFG_MBED

    std::cout << "Hello world!\n";

    wt = new WampTransportRaw {};
    wamp = new WampMBED (*wt);

    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        MsgPack args;

        args.pack_array(1);
        args.pack("hello");

        MsgPack kwargs;
        args.pack_map(0);

        wamp->publish("test", args, kwargs);

        wamp->subscribe("com.example.oncounter", [](mpack_node_t &args, mpack_node_t &kwargs) {
            LOG("Received event: " << MpackPrinter(args).toJSON());
            blinky();
        });
    });

#ifdef YOTTA_CFG_MBED
    button.rise (pressed);
#endif

#ifndef YOTTA_CFG_MBED
    int n=0;
    while (n>=0) {
        n= wt->process();
    }
#endif //YOTTA_CFG_MBED

}
