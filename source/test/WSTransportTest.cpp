#include "WampTransportWS.h"
#include "logger.h"
int main () {
    WampTransportWS wt("ws://localhost:8126/foo");

    wt.onConnect= ([&] () {
        LOG("Sending message");
        wt.sendMessage("Pino",5);
    });

    wt.onMessageBin = ([&] (char* message, size_t size) {
        LOG("Got message:" << message);
    });


    wt.connect();



    int n=0;
    while (n>=0) {
        n= wt.process();
    }
}