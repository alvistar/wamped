//
// Created by Alessandro Viganò on 28/11/15.
//

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
