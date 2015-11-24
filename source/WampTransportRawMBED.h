//
// Created by Alessandro Viganò on 14/11/15.
//

#ifndef CPPWAMP_WAMPTRANSPORTRAW_H
#define CPPWAMP_WAMPTRANSPORTRAW_H

#include "WampTransport.h"
//#include "mbed-drivers/mbed.h"
#include "sal-iface-eth/EthernetInterface.h"
#include "sockets/TCPStream.h"
#include <memory>

#define MAXMESSAGESIZE 1024

const int RECV_BUFFER_SIZE = 1024;


using namespace mbed::Sockets::v0;

class WampTransportRaw: public WampTransport{
private:
    string host;
    int port;
    //char buffer[BUFFERSIZE];
    char message[MAXMESSAGESIZE];
    bool handshaken = false;
    EthernetInterface eth;
    unique_ptr <TCPStream> _stream;
    SocketAddr _remoteAddr;         /**< The remote address */
    volatile bool _error;
    char _buffer[RECV_BUFFER_SIZE];
    size_t _bpos;                   /**< The current offset in the response buffer */

    void decode(char buffer[], int size);
    void handshake();

public:
    WampTransportRaw(string host="127.0.0.1", int port=8080);
    void connect();
    int process();
    void sendMessage(string &msg);
    void sendMessage(char* buffer, size_t size) override;
    void onDNS(Socket *s, socket_addr addr, const char *domain);
    void onError(Socket *s, socket_error_t err);

    void onSocketConnect(TCPStream *s);

    void onReceive(Socket *s);

    void onDisconnect(TCPStream *s);
};




#endif //CPPWAMP_WAMPTRANSPORTRAW_H
