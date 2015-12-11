# Introduction
WampEmb is a C++ 11 implementation of [Wamp protocol](http://wamp-proto.org), born for running on
[ARM mbed OS](https://www.mbed.com/en/).

It can run also on Posix compliances OS (tested on Linux and OSX), with the primary purpose to
 achieve faster development time.

 This library has been made for experimenting purpose and it's not complete and, probably,
 will be not maintained.

 Anyway it is working and succesfully tested on Frescale Freedom K64f.

 # Features
 * C++ 11 Wamp Library - built without using Exceptions to be mbed friendly
 * Supporting MessagePack serialization
 * Working on RawTransport and Websocket

 # Building
 ## OSX and Linux
 ``` shell
 makedir build
 cd build
 cmake ..
 ```
 ## mbed
 ``` shell
 yotta build
 ```

 # Programming


 ## Initializing
 First create a Transport and a Wamp object
``` C++
 WampTransport wt {"ws://demo.crossbar.io:8080"};
 Wamp wamp {wt};
```
 ## Connecting
 You are ready to connect:
``` C++
wamp->connect([&]() {
// Your statements after connection go here
}
```
## Publish
``` C++
wamp->pub("yourtopic",arg1, arg2, arg3);
```
## Subscribe
``` C++
wamp->subscribe("com.example.topic", [](MPNode args, MPNode kwargs) {
    LOG("Received event: " << args);
}
```
## Call remote procedure
``` C++
wamp->call("com.example.add", MsgPackArr {20,3}, MsgPackMap{},
           [](URI err, MPNode args, MPNode kwargs) {
               (void) kwargs;
           if (!err.empty()) {
        LOG("Received result:" << args);
    }

});
```

## Register procedure
``` C++
int sum(int x, int y) {
    return x+y;
}

wamp->registerProcedure("com.mydevice.sum", sum, [](URI err) {
    if (!err.empty()) {
        LOG("REGISTRATION ERROR:" << err);
    }
    LOG("Registration OK");
});
```

# Example
## Start new project
- Create new directory
``` shell
mkdir hellowamp
cd hellowamp
```

- Initialize yotta
``` shell
yotta init
yotta target frdm-k64f-gcc
```

- Add dependency to wamped module to module.json
``` json
{
  "name": "hellowamp",
  "version": "0.0.0",
  "bin": "./source",
  "private": true,
  "author": "",
  "license": "Apache-2.0",
  "dependencies": {
  	"wamped" : "alvistar/wamped#",
  	"mbed-drivers" : "*",
  	"sockets" : "*"
  }
}
```

- (Optional) create config.json for logging
``` json
{
	"wamped":{
		"debug": {
			"transport" : false,
			"wamp" : true
		}
	}
}
```

- Create the main app file "sources/app.cpp"
``` C++
#include <iostream>
#include "mbed-drivers/mbed.h"
#include "minar/minar.h"
#include "wamped/Wamp.h"
#include "wamped/WampTransportWS.h"
#include "wamped/logger.h"

WampTransportWS *wt;
Wamp *wamp;


DigitalOut cled {LED_BLUE,1};

static void blinky(void) {
    static DigitalOut led(LED1);
    led = !led;
}

void app_start(int, char**) {

    std::cout << "Hello world!\r\n";

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
```

- We need to enable C++ 11 support: create file "sources/app.CMAKE"
``` cmake
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -Wno-literal-suffix")
```

**As Mbed OS is in current beta there can be problems in building with some versions of Cmake.**

## Full Demo
Some demos are available in this repository.

First change the ip address and put the one of your host in file *source/test.WampMBEDMain.cpp*.

``` C++
const std::string URL {"ws://192.168.20.192:8080/ws"};
```

To build it:
``` shell
git clone https://github.com/alvistar/wamped.git
cd wamped
yotta target frdm-k64f-gcc
yotta build
```

Demos will be built in build/frdm-k64f-gcc/existing/source/test

To launch demo Crossbar router:
```
cd crossbar
pip install -r requirements.txt
crossbar start --loglevel trace
```

You can now connect from freedom board and launch web demo at *localhost:8080*.

