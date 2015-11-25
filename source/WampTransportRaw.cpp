//
// Created by Alessandro Viganò on 14/11/15.
//

#include "WampTransportRaw.h"
#include <netdb.h>
#include <iomanip>
#include <math.h>
#include <iostream>
#include <sstream>

#ifdef DEBUG_WAMP_TRANSPORT
#include "logger.h"
#else
#define LOG(X)
#endif

typedef enum {WAITHANDSHAKE,WAITPREFIX,WAITMSG} stateT;

std::string toHexString(const unsigned char *data, size_t dataLen, bool format = true) {
    std::stringstream out;
    out << std::setfill('0');
    for(size_t i = 0; i < dataLen; ++i) {
        out << std::hex << std::setw(2) << (int)data[i];
        if (format) {
            out << (((i + 1) % 16 == 0) ? "\n" : " ");
        }
    }
    return out.str();
}

WampTransportRaw::WampTransportRaw(string host, int port):host(host),port(port)
{

}

void WampTransportRaw::handshake()
{
    char handshake [] = {0x7f, 0x02, 0x00, 0x00}; // 0x01 Json 0x02 MsgPack

    /* Send message to the server */
    ssize_t  n = write(sockfd, handshake, 4);

    if (n < 0) {
        LOG("ERROR writing to socket");
        exit(1);
    }
}

void WampTransportRaw::connect()
{
    struct hostent *server;
    struct sockaddr_in serv_addr;

    /* Create a socket point */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    if (sockfd < 0) {
        LOG("ERROR opening socket");
        exit(1);
    }

    server = gethostbyname(host.c_str());

    if (server == NULL) {
        LOG("ERROR, no such host");
        exit(0);
    }

    bzero((char *) &serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    bcopy((char *)server->h_addr, (char *)&serv_addr.sin_addr.s_addr, server->h_length);
    serv_addr.sin_port = htons(port);

    /* Now connect to the server */
    if (::connect(sockfd, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
        LOG("ERROR connecting");
        exit(1);
    }

    handshake();
}

int WampTransportRaw::process()
{
    ssize_t n = read(sockfd, buffer, sizeof(buffer));

    if (n < 0) {
        LOG("ERROR reading from socket");
        exit(1);
    }

    if (n>0) {
        decode(buffer, (int) n);
    }
    return 1;
}

void WampTransportRaw::sendMessage(string &msg) {
    unsigned long int msg_size;
    char prefix[4];
    msg_size = msg.length();
    prefix[0] = 0;
    prefix[3] = (char) (msg_size & 0xff);
    prefix[2] = (char) ((msg_size >> 8) & 0xff);
    prefix[1] = (char) ((msg_size >> 16) & 0xff);

    ssize_t  n;
    /* Send prefix to the server */
    n = write(sockfd, prefix, 4);

    if (n < 0) {
        LOG("ERROR writing to socket");
        exit(1);
    }

    /* Send message to the server */
    n = write(sockfd, msg.c_str(), msg_size);

    if (n < 0) {
        LOG("ERROR writing to socket");
        exit(1);
    }

}

void WampTransportRaw::sendMessage(char *buffer, size_t size) {
	unsigned long int msg_size;
    char prefix[4];
    msg_size = size;
    prefix[0] = 0;
    prefix[3] = (char) (msg_size & 0xff);
    prefix[2] = (char) ((msg_size >> 8) & 0xff);
    prefix[1] = (char) ((msg_size >> 16) & 0xff);

    ssize_t  n;
    /* Send prefix to the server */
    n = write(sockfd, prefix, 4);

    if (n < 0) {
        LOG("ERROR writing to socket");
        exit(1);
    }

    /* Send message to the server */
    n = write(sockfd, buffer, msg_size);

    if (n < 0) {
        LOG("ERROR writing to socket");
        exit(1);
    }
}

void WampTransportRaw::decode(char *buffer, int size)
{
    static int byteNumber;
    static stateT state = WAITHANDSHAKE;
    int prefixCount =0;
    char prefixMSG[4];
    unsigned long int  max_len_send;
    unsigned long int msgSize=0;
    int serializer_type;

    //LOG(DEBUG) << "Decoding Size:" << size << "Payload:" << toHexString((const unsigned char *) buffer, size);

    for (int i=0; i<size; i++) {
        switch (state) {
            case WAITHANDSHAKE:
                switch (byteNumber) {
                    case 0: //First byte must be 0x7f
                        if (buffer[i] != 0x7f) {
                            LOG("Invalid magic byte");
                        }
                        else {
                            byteNumber++;
                        }
                        break;
                    case 1: //Read max len and streaming size
                        max_len_send = (unsigned long int) pow(2, (9 + ((unsigned char) buffer[i] >>4)));
                        LOG("Max bytes per message " <<  max_len_send);
                        serializer_type = buffer[i] & 0x0f;
                        LOG("Serializer  " <<  serializer_type);
                        byteNumber++;
                        break;
                    case 2: // First reserved byte
                        if (buffer[i] != 0) {
                            LOG("Reserved byte must be zero");
                            byteNumber = 0;
                        }
                        byteNumber++;
                        break;
                    case 3: // Second reserved byte
                        if (buffer[i] != 0) {
                            LOG("Reserved byte must be zero");
                            byteNumber = 0;
                        }
                        state = WAITPREFIX;
                        byteNumber =0;
                        onConnect();
                        break;

                    default:
                        break;
                }
                break;
            case WAITPREFIX:
                if (byteNumber < 4) {
                    prefixMSG[byteNumber] = buffer[i];
                    byteNumber++;
                    break;
                }
                else {
                    LOG("Prefix " << toHexString((const unsigned char *) prefixMSG, 4));
                    msgSize = ntohl(*((unsigned long *) &prefixMSG));
                    LOG("Msg size: " << msgSize);
                    state = WAITMSG;
                    byteNumber = 0;
                }

            case WAITMSG:
                message[byteNumber]=buffer[i];
                byteNumber++;

                if (byteNumber == msgSize) {
                    LOG("Frame received- delivering to WAMP");
                    state = WAITPREFIX;
                    byteNumber=0;
                    onMessageBin(message, msgSize);
                }


                break;
            default:
                break;
        }
    }




}


