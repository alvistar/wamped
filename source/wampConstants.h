//
// Created by Alessandro Viganò on 17/04/15.
//

#ifndef CPPWAMP_WAMPCONSTANTS_H
#define CPPWAMP_WAMPCONSTANTS_H

enum wamp_messages {
    WAMP_MSG_HELLO =1,
    WAMP_MSG_WELCOME = 2,
    WAMP_MSG_ERROR = 8,
    WAMP_MSG_PUBLISH = 16,
    WAMP_MSG_SUBSCRIBE = 32,
    WAMP_MSG_SUBSCRIBED = 33,
    WAMP_MSG_EVENT = 36,
    WAMP_MSG_CALL = 48,
    WAMP_MSG_RESULT = 50,
    WAMP_MSG_REGISTER = 64,
    WAMP_MSG_REGISTERED = 65,
    WAMP_MSG_INVOCATION = 68,
    WAMP_MSG_YIELD = 70
};

typedef unsigned long long int WampID ;
#endif //CPPWAMP_WAMPCONSTANTS_H
