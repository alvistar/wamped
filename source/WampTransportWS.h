//
// Created by Alessandro Viganò on 26/11/15.
//

#ifndef WAMP_MBED_WAMPTRANSPORTWS_H
#define WAMP_MBED_WAMPTRANSPORTWS_H

#ifdef YOTTA_CFG_MBED
#include "SocketMBED.h"
#else
#include "SocketOSX.h"
#endif

#include <vector>
#include "WampTransport.h"


#define BUFFERSIZE 4096

class WampTransportWS: public WampTransport {
private:
    SocketPAL socket;

    char host[128];
    uint16_t port;
    string url;
    string origin;
    char path[128];
    char buffer[BUFFERSIZE];
    bool upgraded = false;
    bool useMask = true;
    std::vector<uint8_t> rxbuf;
    std::vector<uint8_t> receivedData;
    size_t _bpos;

    void onError(spal::error serr);
    void onSocketConnect();
    void onReadable();
    void onDisconnect();

    void handshake();
    void decodeWS(char *buffer, const size_t &size);
    void decode(char *buffer, const size_t &size);
    int readLine(char *buffer, int size, std::string &s);

public:
    WampTransportWS(const std::string& url, const std::string& origin=std::string());

    void connect() override ;
    void process() override;
    void sendMessage(char* buffer, size_t size) override;


};





#endif //WAMP_MBED_WAMPTRANSPORTWS_H
