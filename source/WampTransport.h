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

    virtual void process() = 0;
    virtual void sendMessage(string &msg) {
    	(void) msg;
    };
    virtual void sendMessage(char* buffer, size_t size) = 0;
    virtual void connect() {};
};

class WampTransportServer {

public:
    function<void(WampConn&)> onConnect = nullptr;
    function<void(WampConn&)> onClose = nullptr;
    function<void(WampConn&, string)> onMessage = nullptr;

    virtual void process() = 0;
    virtual void sendMessage(WampConn &conn, string &msg) = 0;
    virtual int start() =0;

};
#endif //_CPPWAMP_WAMPTRANSPORT_H_
