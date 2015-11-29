//
// Created by Alessandro Viganò on 26/11/15.
//

#include "WampTransportWS.h"
#include <stdlib.h>
#include <stdio.h>

#define DEBUG_WAMP_TRANSPORT

#ifdef DEBUG_WAMP_TRANSPORT
#include "logger.h"
#else
#define LOG(X)
#endif


enum rlstate {

    WAIT_CARRIAGE,
    WAIT_LF
};

// http://tools.ietf.org/html/rfc6455#section-5.2  Base Framing Protocol
//
//  0                   1                   2                   3
//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
// +-+-+-+-+-------+-+-------------+-------------------------------+
// |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
// |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
// |N|V|V|V|       |S|             |   (if payload len==126/127)   |
// | |1|2|3|       |K|             |                               |
// +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
// |     Extended payload length continued, if payload len == 127  |
// + - - - - - - - - - - - - - - - +-------------------------------+
// |                               |Masking-key, if MASK set to 1  |
// +-------------------------------+-------------------------------+
// | Masking-key (continued)       |          Payload Data         |
// +-------------------------------- - - - - - - - - - - - - - - - +
// :                     Payload Data continued ...                :
// + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
// |                     Payload Data continued ...                |
// +---------------------------------------------------------------+
struct wsheader_type {
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
};


void WampTransportWS::connect() {

    if (url.size() >= 128) {
        fprintf(stderr, "ERROR: url size limit exceeded: %s\n", url.c_str());
        exit(1);
    }
    if (origin.size() >= 200) {
        fprintf(stderr, "ERROR: origin size limit exceeded: %s\n", origin.c_str());
        exit(1);
    }

    if (sscanf(url.c_str(), "ws://%[^:/]:%hu/%s", host, &port, path) == 3) {
    }
    else if (sscanf(url.c_str(), "ws://%[^:/]/%s", host, path) == 2) {
        port = 80;
    }
    else if (sscanf(url.c_str(), "ws://%[^:/]:%hu", host, &port) == 2) {
        path[0] = '\0';
    }
    else if (sscanf(url.c_str(), "ws://%[^:/]", host) == 1) {
        port = 80;
        path[0] = '\0';
    }
    else {
        LOG("ERROR: Could not parse WebSocket url "<< url.c_str());
        exit(1);
    }

    socket.connect(host, port);


}

void WampTransportWS::handshake() {
    char line[256];
    int status;
    int i;
    snprintf(line, 256, "GET /%s HTTP/1.1\r\n", path);
    socket.send(line, strlen(line));
    if (port == 80) {
        snprintf(line, 256, "Host: %s\r\n", host);
        socket.send(line, strlen(line));
    }
    else {
        snprintf(line, 256, "Host: %s:%d\r\n", host, port);
        socket.send(line, strlen(line));
    }
    snprintf(line, 256, "Upgrade: websocket\r\n");
    socket.send(line, strlen(line));
    snprintf(line, 256, "Connection: Upgrade\r\n");
    socket.send(line, strlen(line));
    if (!origin.empty()) {
        snprintf(line, 256, "Origin: %s\r\n", origin.c_str());
        socket.send(line, strlen(line));
    }
    snprintf(line, 256, "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==\r\n");
    socket.send(line, strlen(line));
    snprintf(line, 256, "Sec-WebSocket-Version: 13\r\n");
    socket.send(line, strlen(line));
    snprintf(line, 256, "Sec-WebSocket-Protocol: wamp.2.msgpack\r\n");
    socket.send(line, strlen(line));
    snprintf(line, 256, "\r\n");
    socket.send(line, strlen(line));
}

void WampTransportWS::process() {
    socket.process();
//    ssize_t n = read(sockfd, buffer, sizeof(buffer));
//
//    if (n < 0) {
//        LOG("ERROR reading from socket");
//        exit(1);
//    }
//
//    if (n>0) {
//        decode(buffer, (int) n);
//    }
//
//    //Sending
//    while (txbuf.size()) {
//        int ret = ::send(sockfd, (char*)&txbuf[0], txbuf.size(), 0);
//        if (false) { } // ??
//        else if (ret < 0 && (socketerrno == SOCKET_EWOULDBLOCK || socketerrno == SOCKET_EAGAIN_EINPROGRESS)) {
//            break;
//        }
//        else if (ret <= 0) {
//
//            //TODO
//            //closesocket(sockfd);
//            //readyState = CLOSED;
//            fputs(ret < 0 ? "Connection error!\n" : "Connection closed!\n", stderr);
//            break;
//        }
//        else {
//            txbuf.erase(txbuf.begin(), txbuf.begin() + ret);
//        }
//    }
}

void WampTransportWS::sendMessage(char *buffer, size_t size) {
    const uint8_t masking_key[4] = { 0x12, 0x34, 0x56, 0x78 };
    std::vector<uint8_t> txbuf;
    // TODO: consider acquiring a lock on txbuf...
    // TODO: check status

    wsheader_type::opcode_type type = wsheader_type::BINARY_FRAME;

    std::vector<uint8_t> header;
    header.assign(2 + (size >= 126 ? 2 : 0) + (size >= 65536 ? 6 : 0) + (useMask ? 4 : 0), 0);
    header[0] = 0x80 | type;
    if (false) { }
    else if (size < 126) {
        header[1] = (size & 0xff) | (useMask ? 0x80 : 0);
        if (useMask) {
            header[2] = masking_key[0];
            header[3] = masking_key[1];
            header[4] = masking_key[2];
            header[5] = masking_key[3];
        }
    }
    else if (size < 65536) {
        header[1] = 126 | (useMask ? 0x80 : 0);
        header[2] = (size >> 8) & 0xff;
        header[3] = (size >> 0) & 0xff;
        if (useMask) {
            header[4] = masking_key[0];
            header[5] = masking_key[1];
            header[6] = masking_key[2];
            header[7] = masking_key[3];
        }
    }
    else { // TODO: run coverage testing here
        header[1] = 127 | (useMask ? 0x80 : 0);
        header[2] = (size >> 56) & 0xff;
        header[3] = (size >> 48) & 0xff;
        header[4] = (size >> 40) & 0xff;
        header[5] = (size >> 32) & 0xff;
        header[6] = (size >> 24) & 0xff;
        header[7] = (size >> 16) & 0xff;
        header[8] = (size >>  8) & 0xff;
        header[9] = (size >>  0) & 0xff;
        if (useMask) {
            header[10] = masking_key[0];
            header[11] = masking_key[1];
            header[12] = masking_key[2];
            header[13] = masking_key[3];
        }
    }
    // N.B. - txbuf will keep growing until it can be transmitted over the socket:
    txbuf.insert(txbuf.end(), header.begin(), header.end());

    size_t N = txbuf.size();
    txbuf.resize(N+size);
    memcpy((char*)&txbuf[0]+N, buffer, (size_t) size);

    if (useMask) {
        for (size_t i = 0; i != size; ++i) { *(txbuf.end() - size + i) ^= masking_key[i&0x3]; }
    }

    socket.send((char*)&txbuf[0], txbuf.size());
}


//Return n bytes consumed
int WampTransportWS::readLine(char *buffer, int size, std::string &s) {
    rlstate state= WAIT_CARRIAGE;
    int i;

    for (i=0; i<size; i++) {
        s.append(1, buffer[i]);

        switch (state) {
            case WAIT_CARRIAGE:
                if (buffer[i]=='\r')
                    state = WAIT_LF;
                break;
            case WAIT_LF:
                if(buffer[i]=='\n') {
                    state = WAIT_CARRIAGE;
                }
                return i+1;
            default:{}
        }
    }

    return i;
}


void WampTransportWS::decode(char *buffer, const size_t &size) {
    static int mhLines = 0;

    if (upgraded) {
        decodeWS(buffer, size);
        return;
    }
    else {
        std::string line;
        int ret = readLine(buffer, size, line);

        //Check if we have a complete line
        if (line.back()=='\n') {
            mhLines++;
            LOG("Header Line of size:" <<line.length() << " : " << line);

            //Do checks
            if (mhLines ==1 ) {
                int status;
                if (sscanf(line.c_str(), "HTTP/1.1 %d", &status) != 1 || status != 101) {
                    LOG("ERROR: Got bad status connecting " << status);
                    exit(1);
                }
            }

            if (line=="\r\n") {
                LOG("Connection succefully upgraded");
                upgraded =1;
                onConnect();
            }

            line.clear();

        }

        if (ret < size) {
            decode(&buffer[ret], size - ret);
        }
    }
}

void WampTransportWS::decodeWS(char *buffer, const size_t &size) {
    size_t N = rxbuf.size();
    rxbuf.resize(N+size);
    memcpy((char*)&rxbuf[0]+N, buffer, (size_t) size);

    while (true) {
        wsheader_type ws;
        if (rxbuf.size() < 2) { return; /* Need at least 2 */ }
        const uint8_t * data = (uint8_t *) &rxbuf[0]; // peek, but don't consume
        ws.fin = (data[0] & 0x80) == 0x80;
        ws.opcode = (wsheader_type::opcode_type) (data[0] & 0x0f);
        ws.mask = (data[1] & 0x80) == 0x80;
        ws.N0 = (data[1] & 0x7f);
        ws.header_size = 2 + (ws.N0 == 126? 2 : 0) + (ws.N0 == 127? 8 : 0) + (ws.mask? 4 : 0);
        if (rxbuf.size() < ws.header_size) { return; /* Need: ws.header_size - rxbuf.size() */ }
        int i = 0;
        if (ws.N0 < 126) {
            ws.N = ws.N0;
            i = 2;
        }
        else if (ws.N0 == 126) {
            ws.N = 0;
            ws.N |= ((uint64_t) data[2]) << 8;
            ws.N |= ((uint64_t) data[3]) << 0;
            i = 4;
        }
        else if (ws.N0 == 127) {
            ws.N = 0;
            ws.N |= ((uint64_t) data[2]) << 56;
            ws.N |= ((uint64_t) data[3]) << 48;
            ws.N |= ((uint64_t) data[4]) << 40;
            ws.N |= ((uint64_t) data[5]) << 32;
            ws.N |= ((uint64_t) data[6]) << 24;
            ws.N |= ((uint64_t) data[7]) << 16;
            ws.N |= ((uint64_t) data[8]) << 8;
            ws.N |= ((uint64_t) data[9]) << 0;
            i = 10;
        }
        if (ws.mask) {
            ws.masking_key[0] = ((uint8_t) data[i+0]) << 0;
            ws.masking_key[1] = ((uint8_t) data[i+1]) << 0;
            ws.masking_key[2] = ((uint8_t) data[i+2]) << 0;
            ws.masking_key[3] = ((uint8_t) data[i+3]) << 0;
        }
        else {
            ws.masking_key[0] = 0;
            ws.masking_key[1] = 0;
            ws.masking_key[2] = 0;
            ws.masking_key[3] = 0;
        }
        if (rxbuf.size() < ws.header_size+ws.N) { return; /* Need: ws.header_size+ws.N - rxbuf.size() */ }

        // We got a whole message, now do something with it:
        if (false) { }
        else if (
                ws.opcode == wsheader_type::TEXT_FRAME
                || ws.opcode == wsheader_type::BINARY_FRAME
                || ws.opcode == wsheader_type::CONTINUATION
                ) {
            if (ws.mask) { for (size_t i = 0; i != ws.N; ++i) { rxbuf[i+ws.header_size] ^= ws.masking_key[i&0x3]; } }
            receivedData.insert(receivedData.end(), rxbuf.begin()+ws.header_size, rxbuf.begin()+ws.header_size+(size_t)ws.N);// just feed
            if (ws.fin) {
                //callable((const std::vector<uint8_t>) receivedData);
                LOG("Received complete message: " << (char*) &receivedData[0]);
                onMessageBin((char*) &receivedData[0],receivedData.size());
                receivedData.erase(receivedData.begin(), receivedData.end());
                std::vector<uint8_t> ().swap(receivedData);// free memory
            }
        }
        else if (ws.opcode == wsheader_type::PING) {
            if (ws.mask) { for (size_t i = 0; i != ws.N; ++i) { rxbuf[i+ws.header_size] ^= ws.masking_key[i&0x3]; } }
            //TODO
            //std::string data(rxbuf.begin()+ws.header_size, rxbuf.begin()+ws.header_size+(size_t)ws.N);

            //sendData(wsheader_type::PONG, data.size(), data.begin(), data.end());
        }
        else if (ws.opcode == wsheader_type::PONG) { }
        else if (ws.opcode == wsheader_type::CLOSE) {
            //TODO
            //close();
            }
        else {
            fprintf(stderr, "ERROR: Got unexpected WebSocket message.\n");
            //TODO
            //close();
            }

        rxbuf.erase(rxbuf.begin(), rxbuf.begin() + ws.header_size+(size_t)ws.N);
    }


}

WampTransportWS::WampTransportWS(const std::string &url, const string &origin):url(url),origin(origin) {
    socket.onError = [this](spal::error serr) {
        this->onError(serr);
    };

    socket.onSocketConnect =[this]() {
        this->onSocketConnect();
    };

    socket.onReadable =[this]() {
        this->onReadable();
    };

    socket.onDisconnect=[this]() {
        this->onDisconnect();
    };
}

void WampTransportWS::onError(spal::error serr) {
    LOG("ERROR "<< spal::getError(serr));
    onDisconnect();

}

void WampTransportWS::onSocketConnect() {
    handshake();
}

void WampTransportWS::onReadable() {
    _bpos = sizeof(buffer);
    /* Read data out of the socket */
    socket.read(buffer, _bpos);

    //LOG("Going to decode " <<_bpos);

    if (_bpos>0 )
        decode(buffer, _bpos);
}


void WampTransportWS::onDisconnect() {

}
