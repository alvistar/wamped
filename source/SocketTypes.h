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

#ifndef WAMP_MBED_SOCKETTYPES_H
#define WAMP_MBED_SOCKETTYPES_H

#include <functional>
#include <string>

namespace spal {

    enum error {
        SOCKETNOTCONNECTED,
        CONNREFUSED = 61
    };



    typedef enum readyStateValues { CLOSING, CLOSED, CONNECTING, OPEN } readyStateValues;

    typedef std::function<void(spal::error)> TOnErrorCallback;
    typedef std::function<void()> TOnSocketConnectCallback;
    typedef std::function<void()> TOnReadableCallback;
    typedef std::function<void()> TOnDisconnectCallback;
    typedef std::function<void(size_t bytes)> TOnSentCallback;



    std::string getError(error sperr);
};

#endif //WAMP_MBED_SOCKETTYPES_H
