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

#include <malloc.h>
#include "SocketMBED.h"
#include "sal-stack-lwip/lwipv4_init.h"

#ifdef DEBUG_WAMP_SOCKET
#include "logger.h"
#else
#define LOG(X)
#endif

SocketPAL::SocketPAL() {
    eth.init();
    eth.connect();
    lwipv4_socket_init();
    LOG ("TCP client IP Address is " << eth.getIPAddress());
    _stream = unique_ptr<TCPStream> (new TCPStream (SOCKET_STACK_LWIP_IPV4));
    _stream->open(SOCKET_AF_INET4);
    _stream->setOnError(TCPStream::ErrorHandler_t(this, &SocketPAL::_onError));
    _stream->setOnSent(TCPStream::SentHandler_t(this, &SocketPAL::_onSent));
}

void SocketPAL::connect(std::string host, uint16_t port) {
    _stream->resolve(host.c_str(), TCPStream::DNSHandler_t(this, &SocketPAL::_onDNS));
    this->port = port;
}

void SocketPAL::_send() {

    if (bytesToAck == 0) {
        bytesToAck = txbuf.size();
        socket_error_t err;
        err = _stream->send((char*)&txbuf[0], txbuf.size());
        _stream->error_check(err);
    }

}

void SocketPAL::send(char *data, size_t size) {
    LOG("Adding to buffer "<< size<< " bytes");

    size_t N = txbuf.size();
    txbuf.resize(N+size);
    memcpy((char*)&txbuf[0]+N, data, (size_t) size);

    _send();
}



void SocketPAL::_onDNS(Socket *s, socket_addr addr, const char *domain) {
    /* Check that the result is a valid DNS response */
    if (socket_addr_is_any(&addr)) {
        /* Could not find DNS entry */
        LOG("Could not find DNS entry for %s" << domain);
        //onError(s, SOCKET_ERROR_DNS_FAILED);
    } else {
        /* Start connecting to the remote host */
        char buf[16];
        _remoteAddr.setAddr(&addr);
        _remoteAddr.fmtIPv4(buf,sizeof(buf));
        LOG("DNS Response Received:" << domain << " " << buf);
        LOG("Connecting to: "<< buf << " port:" << port);
        socket_error_t err = _stream->connect(_remoteAddr, (const uint16_t) port,
                                              TCPStream::ConnectHandler_t(this, &SocketPAL::_onSocketConnect));

        if (err != SOCKET_ERROR_NONE) {
            _onError(s, err);
        }
    }
}

void SocketPAL::_onError(Socket *s, socket_error_t err) {
    (void) s;
    LOG("MBED: Socket Error: " << socket_strerror(err) << ":" << err);
    _stream->close();
    //TODO fix error messages
    onError(spal::error::SOCKETNOTCONNECTED);
}

void SocketPAL::_onSocketConnect(TCPStream *s) {
    char buf[16];
    _remoteAddr.fmtIPv4(buf, sizeof(buf));
    LOG("Connected");
    /* Send the request */
    s->setOnReadable(TCPStream::ReadableHandler_t(this, &SocketPAL::_onReadable));
    s->setOnDisconnect(TCPStream::DisconnectHandler_t(this, &SocketPAL::_onDisconnect));

    onSocketConnect();
}


void SocketPAL::_onReadable(Socket *s) {
    _socket = s;
    onReadable();
}

void SocketPAL::read(char *buffer, size_t &size) {
    socket_error_t err = _socket->recv(buffer, &size);

    if (err != SOCKET_ERROR_NONE) {
        _onError(_socket, err);
        return;
    }
}

void SocketPAL::_onSent(Socket *s, uint16_t nbytes) {
    (void) s;
    bytesToAck = bytesToAck - nbytes;

    if (bytesToAck == 0) {
        txbuf.erase(txbuf.begin(),txbuf.begin()+nbytes);
    }

    _send();
}

void SocketPAL::_onDisconnect(TCPStream *s) {
    (void) s;
    close();

}

void SocketPAL::process() {

}

void SocketPAL::close() {
    LOG("Socket disconnected");
    _socket->close();
    onDisconnect();
}
