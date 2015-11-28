//
// Created by Alessandro Viganò on 14/11/15.
//

#ifndef CPPWAMP_WAMPTRANSPORTRAW_H
#define CPPWAMP_WAMPTRANSPORTRAW_H

#ifdef YOTTA_CFG_MBED
#include "sal-iface-eth/EthernetInterface.h"
#include "sockets/TCPStream.h"
#else
#include "sockets.h"
#endif

#include "WampTransport.h"
#include <memory>
#include <vector>

#define MAXMESSAGESIZE 1024

const int RECV_BUFFER_SIZE = 1024;

using namespace mbed::Sockets::v0;

struct message_t {
	char* data;
	size_t size;
};

class WampTransportRaw: public WampTransport{
private:
    string host;
    int port;
    //char buffer[BUFFERSIZE];
    std::vector<message_t> messages;
    char message[MAXMESSAGESIZE];
    bool handshaken = false;
    EthernetInterface eth;
    unique_ptr <TCPStream> _stream;
    SocketAddr _remoteAddr;         /**< The remote address */
    volatile bool _error;
    char _buffer[RECV_BUFFER_SIZE];
    size_t _bpos;                   /**< The current offset in the response buffer */
    size_t unacked;
    bool writeReady = true;
    bool useMask;

    void decode(char buffer[], int size);
    void handshake();
    void dequeue();
    void _sendMessage();

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
    void onSent(Socket *s, uint16_t nbytes);
};




#endif //CPPWAMP_WAMPTRANSPORTRAW_H
