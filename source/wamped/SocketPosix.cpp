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

#include <string>
#include "SocketPosix.h"
#include <netdb.h>
#include <stdlib.h>
#include <sys/errno.h>
#include <cstring>
#include <unistd.h>

#ifdef DEBUG_WAMP_SOCKET
#include "logger.h"
#else
#define LOG(X)
#endif

SocketPAL::SocketPAL() {

}

void SocketPAL::connect(std::string host, uint16_t port) {
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
        LOG("ERROR connecting " << errno);
        onError(getError(errno));
        return;
    }

    LOG("Connected");
    state = readyStateValues::OPEN;
    onSocketConnect();

}

void SocketPAL::send(char *data, size_t size) {
    LOG("Adding to buffer "<< size<< " bytes");

    size_t N = txbuf.size();
    txbuf.resize(N+size);
    memcpy((char*)&txbuf[0]+N, data, (size_t) size);

}



void SocketPAL::read(char *buffer, size_t &size) {
    if (state != OPEN) {
        size = 0;
        return;
    }


    ssize_t n = ::read(sockfd, buffer, size);

    if (n <= 0) {
        LOG("ERROR reading from socket " << errno);
        close();
        size =0;
        onError(getError(errno));

        return;
    }
    else {
        LOG("Received "<< n << " bytes");
    }

    size = (size_t) n;

};


void SocketPAL::process() {
    //TODO: check connection

    if (state != OPEN) {
        return;
    }

    while (txbuf.size()) {
        LOG("Sending out "<< txbuf.size());
        ssize_t ret = ::send(sockfd, (char*)&txbuf[0], txbuf.size(), 0);

        if (ret <=0) {
            LOG("ERROR writing to socket " << errno);
            close();
            onError(getError(errno));
        }
        else {
            txbuf.erase(txbuf.begin(),txbuf.begin()+ret);
            LOG ("Sent out " << ret << " bytes");
        }
    }

    onReadable();
}

spal::error SocketPAL::getError(int error) {
    if (error ==0)
        return spal::error::SOCKETNOTCONNECTED;

    return (spal::error) error;
}

void SocketPAL::close() {
    state = CLOSED;
    txbuf.clear();
    ::close(sockfd);
}
