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

#ifndef CPPWAMP_PLATFORM_MBED_H
#define CPPWAMP_PLATFORM_MBED_H

#include "sal-iface-eth/EthernetInterface.h"
#include "sockets/TCPStream.h"
#include <memory>
#include <vector>
#include "SocketTypes.h"



using namespace mbed::Sockets::v0;
using namespace spal;

class SocketPAL {
private:
    EthernetInterface eth;
    unique_ptr <TCPStream> _stream;
    SocketAddr _remoteAddr;         /**< The remote address */
    Socket* _socket;
    uint16_t port;
    std::vector<uint8_t> txbuf;
    size_t bytesToAck = 0;

    void _send();

    void _onDNS(Socket *s, socket_addr addr, const char *domain);
    void _onError(Socket *s, socket_error_t err);

    void _onSocketConnect(TCPStream *s);

    void _onReadable(Socket *s);

    void _onDisconnect(TCPStream *s);
    void _onSent(Socket *s, uint16_t nbytes);
public:
    TOnErrorCallback onError;
    TOnSocketConnectCallback onSocketConnect;
    TOnReadableCallback onReadable;
    TOnSentCallback onSent;
    TOnDisconnectCallback onDisconnect;

    SocketPAL();
    void connect(std::string host, uint16_t port);
    void send(char* data, size_t size);
    void read(char* buffer, size_t &size);
    void process();
    void close();
};

#endif //CPPWAMP_PLATFORM_MBED_H
