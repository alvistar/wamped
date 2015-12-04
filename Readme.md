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
[TOBECOMPLETED]