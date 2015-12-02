#include <iostream>
#include <source/Accelerometer/FXOS8700Q.h>
#include "Wamp.h"
#include "logger.h"
#include "MpackPrinter.h"
#include "mbed-drivers/mbed.h"
#include "WampTransportRaw.h"
#include "WampTransportWS.h"
#include "MsgUnpack.h"
#include "MsgPackCPP.h"
#include "Accelerometer/FXOS8700Q.h"
#include "minar/minar.h"

#define SAMPLERATE 100

//Accelerometer
I2C i2c(PTE25, PTE24);
FXOS8700QAccelerometer accel(i2c,FXOS8700CQ_SLAVE_ADDR1);

motion_data_counts_t acc_raw;
motion_data_units_t acc_data;


//WampTransportRaw *wt;
WampTransportWS *wt;
Wamp *wamp;


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

static void sample(void) {

    accel.getAxis(acc_raw);
    //LOG("x:"<< acc_raw.x<< " y:"<< acc_raw.y << " z:"<< acc_raw.z);

    wamp->pub("acceleremoter",acc_raw.x,acc_raw.y,acc_raw.z);

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
    LOG("Publishing pressed event");

    wamp->publish("button");

}

int sum (int x,int y) {
    return x+y;
}

InterruptIn button(SW2);

void app_start(int, char**) {

    std::cout << "Hello world!\n";

    //wt = new WampTransportRaw {"192.168.20.192"};
    wt = new WampTransportWS {"ws://192.168.20.192:8081"};
    wamp = new Wamp (*wt);



    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        //Send accelerator data
        accel.enable();
        minar::Scheduler::postCallback(sample).period(minar::milliseconds(SAMPLERATE));

        wamp->pub("test", "hello");

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
