#include <iostream>
#include "WampTransportRaw.h"
#include "WampMBED.h"

#define LOG_(LEVEL) std::cout <<

int main() {
    std::cout << "Hello world!\n";
    WampTransportRaw wt {};
    WampMBED wamp {wt};

    wamp.connect([&]() {
        std::cout << "Session joined :" << wamp.sessionID << endl;
        wamp.subscribe("test", nullptr);
    });

    int n=0;
    while (n>=0) {
        n= wt.process();
    }
}