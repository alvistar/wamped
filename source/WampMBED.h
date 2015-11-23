//
// Created by Alessandro Viganò on 16/11/15.
//

#ifndef CPPWAMP_WAMPMBED_H
#define CPPWAMP_WAMPMBED_H

#include <random>
#include <unordered_map>
#include "WampTransport.h"
#include "MsgPackCPP.h"

typedef unsigned long long int WampID;
typedef function<void(msgpack_object&, msgpack_object&)> TSubscriptionCallback;

class WampMBED {
private:
    WampTransport &transport;
    std::random_device rd;
    std::mt19937_64 gen;
    MsgPack mp;
    unordered_map <WampID, TSubscriptionCallback> subscriptionsRequests;

    std::function<void()> onJoin {nullptr};


public:
    WampID sessionID;
    bool connected {false};

    WampMBED(WampTransport &transport);
    void connect(std::function<void()> onJoin);
    void connect(std::function<void()> onJoin, std::function<void()> onError);

    void hello(string realm);
    void subscribe(string topic, TSubscriptionCallback callback);

    void parseMessage(char *buffer, size_t size);

};

#endif //CPPWAMP_WAMPMBED_H
