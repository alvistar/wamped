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

#ifndef CPPWAMP_SOCKETPAL_H
#define CPPWAMP_SOCKETPAL_H

#include "SocketTypes.h"
#include <vector>

using namespace spal;

class SocketPAL
{
private:
    int sockfd;
    spal::error getError(int error);
    std::vector<uint8_t> txbuf;


public:
    TOnErrorCallback onError;
    TOnSocketConnectCallback onSocketConnect;
    TOnReadableCallback onReadable;
    TOnSentCallback onSent;
    TOnDisconnectCallback onDisconnect;

    readyStateValues state = readyStateValues::CLOSED;

    SocketPAL();
    void connect(std::string host, uint16_t port);
    void send(char* data, size_t size);
    void read(char* buffer, size_t &size);
    void process();
    void close();
};

#endif //CPPWAMP_SOCKETPAL_H