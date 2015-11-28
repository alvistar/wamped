//
// Created by Alessandro Viganò on 27/03/15.
//

#include <string>
#include <functional>

using namespace std;

#ifndef _CPPWAMP_WAMPTRANSPORT_H_
#define _CPPWAMP_WAMPTRANSPORT_H_

struct WampConn {

};


class WampTransport {

public:
    function<void()> onConnect = nullptr;
    function<void()> onConnectError = nullptr;
    function<void(string)> onMessage = nullptr;
    function<void(char*, size_t)> onMessageBin = nullptr;
    function<void()> onClose = nullptr;

    virtual int process() = 0;
    virtual void sendMessage(string &msg) {
    	(void) msg;
    };
    virtual void sendMessage(char* buffer, size_t size) = 0;
    virtual void connect() {};
};

class WampTransportServer {

public:
    function<void(WampConn&)> onConnect = nullptr;
    function<void(WampConn&)> onlose = nullptr;
    function<void(WampConn&, string)> onMessage = nullptr;

    virtual int process() = 0;
    virtual void sendMessage(WampConn &conn, string &msg) = 0;
    virtual int start() =0;

};
#endif //_CPPWAMP_WAMPTRANSPORT_H_
