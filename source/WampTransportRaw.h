//
// Created by Alessandro Viganò on 14/11/15.
//

#ifndef CPPWAMP_WAMPTRANSPORTRAW_H
#define CPPWAMP_WAMPTRANSPORTRAW_H

#include "WampTransport.h"

#define BUFFERSIZE 4096
#define MAXMESSAGESIZE 2048

class WampTransportRaw: public WampTransport{
private:
    string host;
    int port;
    int sockfd;
    char buffer[BUFFERSIZE];
    char message[MAXMESSAGESIZE];
    bool handshaken = false;

    void decode(char buffer[], int size);
    void handshake();

public:

    WampTransportRaw(string host="127.0.0.1", int port=8080);
    void connect() override ;
    int process() override;
    void sendMessage(string &msg) override;
    void sendMessage(char* buffer, size_t size) override;

};


#endif //CPPWAMP_WAMPTRANSPORTRAW_H
