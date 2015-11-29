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