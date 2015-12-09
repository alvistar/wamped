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

#include "wamped/WampTransportWS.h"
#include "wamped/logger.h"
int main () {
    WampTransportWS wt("ws://localhost:8126/foo");

    wt.onConnect= ([&] () {
        LOG("Sending message");
        char msg[] = "Hello";
        wt.sendMessage(msg,5);
    });

    wt.onMessageBin = ([&] (char* message, size_t size) {
        (void) size;
        LOG("Got message:" << message);
    });


    wt.connect();



    int n=0;
    while (n>=0) {
        wt.process();
    }
}