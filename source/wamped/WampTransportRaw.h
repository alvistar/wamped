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

#ifdef YOTTA_CFG_MBED
#include "SocketMBED.h"
#else
#include "SocketPosix.h"
#endif

#ifndef CPPWAMP_WAMPTRANSPORTRAW_H
#define CPPWAMP_WAMPTRANSPORTRAW_H



//#ifdef YOTTA_CFG_MBED
//#include "sal-iface-eth/EthernetInterface.h"
//#include "sockets/TCPStream.h"
//#else
//#include "sockets.h"
//#endif

#include "WampTransport.h"
#include <memory>
#include <vector>

#define MAXMESSAGESIZE 1024

const int RECV_BUFFER_SIZE = 1024;

//using namespace mbed::Sockets::v0;

struct message_t {
	char* data;
	size_t size;
};

typedef enum {WAITHANDSHAKE,WAITPREFIX,WAITMSG} stateT;

class WampTransportRaw: public WampTransport{
private:
    string host;
    uint16_t port;
    //char buffer[BUFFERSIZE];
    char message[MAXMESSAGESIZE];
    SocketPAL socket;
    char _buffer[RECV_BUFFER_SIZE];
    size_t _bpos;                   /**< The current offset in the response buffer */
    stateT state = WAITHANDSHAKE;
    unsigned int byteNumber=0;

    void decode(char buffer[], int size);

    void onError(spal::error);
    void onSocketConnect();
    void onReadable();
    void onDisconnect();

public:
    WampTransportRaw(string host="127.0.0.1", uint16_t port=8080);
    void connect() override;
    void process() override;
    void sendMessage(string &msg) override;
    void sendMessage(char* buffer, size_t size) override;

};




#endif //CPPWAMP_WAMPTRANSPORTRAW_H
