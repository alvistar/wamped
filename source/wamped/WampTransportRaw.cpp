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
#include <iomanip>
#include <memory>
#include <sstream>
#include <math.h>
#include "WampTransportRaw.h"
#include <cstring>

#ifdef __linux__
#include <netinet/in.h>
#endif

#ifdef DEBUG_WAMP_TRANSPORT
#include "logger.h"
#else
#define LOG(X)
#endif



struct debug {
    debug() {
    }

    ~debug() {
        std::cerr << m_SS.str() << "\r\n";
    }

public:
    // accepts just about anything
    template<class T>
    debug &operator<<(const T &x) {
        m_SS << x;
        return *this;
    }
private:
    std::ostringstream m_SS;
};

std::string toHexString(const unsigned char *data, size_t dataLen, bool format = true) {
    stringstream out;
    out << std::setfill('0');
    for(size_t i = 0; i < dataLen; ++i) {
        out << std::hex << std::setw(2) << (int)data[i];
        if (format) {
            out << (((i + 1) % 16 == 0) ? "\n" : " ");
        }
    }
    return out.str();
}

WampTransportRaw::WampTransportRaw(string host, uint16_t port):host(host),port(port)
{

    socket.onError = [this](spal::error serr) {
        this->onError(serr);
    };

    socket.onSocketConnect =[this]() {
        this->onSocketConnect();
    };

    socket.onReadable =[this]() {
        this->onReadable();
    };

    socket.onDisconnect=[this]() {
        this->onDisconnect();
    };

}

void WampTransportRaw::connect() {
    LOG("Connecting...");
    socket.connect(host, port);
}


void WampTransportRaw::process() {
    socket.process();
}

void WampTransportRaw::sendMessage(string &msg) {
    (void) msg;
}

//void WampTransportRaw::sendMessage(char* buffer, size_t size) {
//	FunctionPointer2<void, char*, size_t> ptr_to_sendMessage (this, &WampTransporRaw::_sendMessage);
//	minar::Scheduler::postCallBack(ptr_to_sendMessage(buffer,size));
//}

void WampTransportRaw::sendMessage(char* buffer, size_t size) {

	char prefix[4];

    LOG("Sending binary of length " << size);

    prefix[0] = 0;
    prefix[3] = (char) (size & 0xff);
    prefix[2] = (char) ((size >> 8) & 0xff);
    prefix[1] = (char) ((size >> 16) & 0xff);

    /* Send prefix to the server */
    socket.send(prefix,4);

    /* Send message to the server */
	socket.send(buffer,  size);
}


void WampTransportRaw::decode(char *buffer, int size) {
    char prefixMSG[4];
    unsigned long int max_len_send;
    unsigned long int msgSize = 0;
    int serializer_type;

    //LOG(DEBUG) << "Decoding Size:" << size << "Payload:" << toHexString((const unsigned char *) buffer, size);

    for (int i = 0; i < size; i++) {
        switch (state) {
            case WAITHANDSHAKE:
                switch (byteNumber) {
                    case 0: //First byte must be 0x7f
                        if (buffer[i] != 0x7f) {
                            LOG("Invalid magic byte");
                        }
                        else {
                            byteNumber++;
                        }
                        break;
                    case 1: //Re ad max len and streaming size
                        max_len_send = (unsigned long int) pow(2, (9 + ((unsigned char) buffer[i] >> 4)));
                        LOG("Max bytes per message " << max_len_send);
                        serializer_type = buffer[i] & 0x0f;
                        LOG("Serializer  " << serializer_type);
                        byteNumber++;
                        break;
                    case 2: // First reserved byte
                        if (buffer[i] != 0) {
                            LOG("Reserved byte must be zero");
                            byteNumber = 0;
                        }
                        byteNumber++;
                        break;
                    case 3: // Second reserved byte
                        if (buffer[i] != 0) {
                            LOG("Reserved byte must be zero");
                            byteNumber = 0;
                        }
                        LOG("Handshake complete");
                        state = WAITPREFIX;
                        byteNumber = 0;
                        onConnect();
                        break;

                    default:
                        break;
                }
                break;
            case WAITPREFIX:
                if (byteNumber < 4) {
                    prefixMSG[byteNumber] = buffer[i];
                    byteNumber++;
                    break;
                }
                else {
                    LOG("Prefix " << toHexString((const unsigned char *) prefixMSG, 4));
                    msgSize = ntohl(*((unsigned long *) &prefixMSG));
                    LOG("Msg size: " << msgSize);

                    if (! (prefixMSG[0] ==0 && prefixMSG[1] == 0)) {
                        LOG("Unexpected message type");
                        //TODO handle unknown messages
                        exit(1);
                        socket.close();
                        onDisconnect();
                    }

                    state = WAITMSG;
                    byteNumber = 0;
                }

            case WAITMSG:
                message[byteNumber] = buffer[i];
                byteNumber++;

                if (byteNumber == msgSize) {
                    LOG("Got Message of "<< msgSize << " bytes");
                    state = WAITPREFIX;
                    byteNumber = 0;
                    onMessageBin(message, msgSize);
                }

                break;
            default:
                break;
        }
    }
}

void WampTransportRaw::onDisconnect() {
    LOG("Disconnected");
    onClose();

}

void WampTransportRaw::onError(spal::error serr) {
#ifndef DEBUG_WAMP_TRANSPORT
    (void) serr;
#endif
    LOG("ERROR "<< spal::getError(serr));
    onDisconnect();
}

void WampTransportRaw::onSocketConnect() {
    //Handhsake
    LOG("Sending handhsake");
    char handshake [] = {0x7f, 0x02, 0x00, 0x00};

    byteNumber = 0;
    state = WAITHANDSHAKE;

    /* Send message to the server */
    memcpy(_buffer,handshake,4);

    socket.send(_buffer, 4);
}

void WampTransportRaw::onReadable() {
//    printf("HTTP Response received.\r\n");
    _bpos = sizeof(_buffer);
//    /* Read data out of the socket */
    socket.read(_buffer, _bpos);

    //LOG("Going to decode " <<_bpos);

    if (_bpos>0 )
        decode(_buffer, _bpos);
}


