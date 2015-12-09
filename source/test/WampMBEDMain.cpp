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
#include "Accelerometer/FXOS8700Q.h"
#include "wamped/Wamp.h"
#include "mbed-drivers/mbed.h"
#include "wamped/WampTransportRaw.h"
#include "wamped/WampTransportWS.h"
#include "minar/minar.h"

#include "wamped/logger.h"

//#define ENABLE_ACCEL
#define SAMPLERATE 100

//Accelerometer
I2C i2c(PTE25, PTE24);
FXOS8700QAccelerometer accel(i2c,FXOS8700CQ_SLAVE_ADDR1);

motion_data_counts_t acc_raw;
motion_data_units_t acc_data;


//WampTransportRaw *wt;
WampTransportWS *wt;
Wamp *wamp;
uint16_t btnCounter =0;

DigitalOut leds[3] {{LED_BLUE,1},{LED_GREEN,1},{LED_RED,1}};

int8_t cled = -1;

//DigitalOut cled {LED_BLUE,1};

static void blinky(void) {
    static DigitalOut led(LED1);
    led = !led;
}

static void switchon(int color) {
    for (int i=0; i < 3;i++) {
        if (color==i) {
            leds[i] = 0;
            cled = i;
        }
        else
            leds[i] = 1;
    }

    wamp->pub("com.freedom.switched",cled);

}

static void switchoff(void) {
    for (int i=0; i < 3;i++) {
        leds[i] = 1;
    }

    cled = -1;
    wamp->pub("com.freedom.switched",cled);
}

static void sample(void) {

    accel.getAxis(acc_raw);
    //LOG("x:"<< acc_raw.x<< " y:"<< acc_raw.y << " z:"<< acc_raw.z);

    wamp->pub("acceleremoter",acc_raw.x,acc_raw.y,acc_raw.z);

}

static void pressed() {
    LOG("Publishing pressed event");
    btnCounter++;
    wamp->publish("button");
}

static void sw3pressed() {
    if (cled==-1)
        switchon(1);
    else
        switchoff();
}

uint16_t getCounter() {
    return btnCounter;
}

int8_t ledStatus() {
    return cled;
}

int sum (int x,int y) {
    return x+y;
}

InterruptIn button(SW2);
InterruptIn button2(SW3);

void app_start(int, char**) {

    std::cout << "Hello world!\n";

    //wt = new WampTransportRaw {"192.168.20.192",8081};
    wt = new WampTransportWS {"ws://192.168.20.192:8080"};
    wamp = new Wamp (*wt);



    wamp->connect([&]() {
        LOG("Session joined :" << wamp->sessionID);

        //Send accelerator data
#ifdef ENABLE_ACCEL
        accel.enable();
        minar::Scheduler::postCallback(sample).period(minar::milliseconds(SAMPLERATE));
#endif

        wamp->pub("test", "hello");

//        wamp->subscribe("com.example.oncounter", [](mpack_node_t &args, mpack_node_t &kwargs) {
//            LOG("Received event: " << MpackPrinter(args).toJSON());
//            blinky();
//        });

        //wamp->registerProcedure("com.freedom.sum",sum);
        wamp->registerProcedure("com.freedom.getCounter", getCounter);
        wamp->registerProcedure("com.freedom.switchon", switchon);
        wamp->registerProcedure("com.freedom.switchoff", switchoff);
        wamp->registerProcedure("com.freedom.getLedStatus", ledStatus);
//        wamp->subscribe("com.freedom.switchon",[](MPNode args, MPNode kwargs) {
//            (void) kwargs;
//            LOG("Received switchon");
//        	switchon(args[1]);
//        });
//
//        wamp->subscribe("com.freedom.switchoff",[](MPNode args, MPNode kwargs) {
//            (void) args;
//            (void) kwargs;
//            LOG("Received switchon");
//            switchoff();
//        });
    });

    button.rise (pressed);
    button2.rise (sw3pressed);

    wamp->onClose = [&]() {
        NVIC_SystemReset();
    };

}
