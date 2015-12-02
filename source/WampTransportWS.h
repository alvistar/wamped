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

typedef struct wsheader_type {
    unsigned header_size;
    bool fin;
    bool mask;
    enum opcode_type {
        CONTINUATION = 0x0,
        TEXT_FRAME = 0x1,
        BINARY_FRAME = 0x2,
        CLOSE = 8,
        PING = 9,
        PONG = 0xa,
    } opcode;
    int N0;
    uint64_t N;
    uint8_t masking_key[4];
} wsheader_type;


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
    void _sendMessage(const wsheader_type::opcode_type& type, const char *buffer, const size_t& size);

public:
    WampTransportWS(const std::string& url, const std::string& origin=std::string());

    void connect() override ;
    void process() override;
    void sendMessage(char* buffer, size_t size) override;
    void close();


};





#endif //WAMP_MBED_WAMPTRANSPORTWS_H
