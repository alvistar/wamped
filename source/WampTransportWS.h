//
// Created by Alessandro Viganò on 26/11/15.
//
#include <vector>
#include "WampTransport.h"



#ifndef WAMP_MBED_WAMPTRANSPORTWS_H
#define WAMP_MBED_WAMPTRANSPORTWS_H

#define BUFFERSIZE 4096

class WampTransportWS: public WampTransport {
private:
    char host[128];
    int port;
    int sockfd;
    string url;
    string origin;
    char path[128];
    char buffer[BUFFERSIZE];
    bool upgraded = false;
    bool useMask = true;
    std::vector<uint8_t> txbuf;
    std::vector<uint8_t> rxbuf;
    std::vector<uint8_t> receivedData;

    void handshake();
    void decodeWS(char buffer[], int size);
    void decode(char buffer[], int size);
    void hostname_connect(const std::string& hostname, int port);
    int readLine(char *buffer, int size, std::string &s);

public:
    WampTransportWS(const std::string& url, const std::string& origin=std::string()):
            url(url),origin(origin) {};
    void connect() override ;
    void process() override;
    void sendMessage(char* buffer, size_t size) override;


};

#include "WampTransport.h"

#define BUFFERSIZE 4096


#endif //WAMP_MBED_WAMPTRANSPORTWS_H
