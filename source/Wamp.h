//
// Created by Alessandro Viganò on 16/11/15.
//

#ifndef CPPWAMP_WAMPMBED_H
#define CPPWAMP_WAMPMBED_H

#include <random>
#include <unordered_map>
#include "WampTransport.h"
#include "MsgPackCPP.h"
#include "mpack/mpack.h"
#include "MsgUnpack.h"

struct WampError {
    string URI;
};

typedef unsigned long long int WampID_t;
typedef function<void(MPNode,  MPNode)> TSubscriptionCallback;
typedef function<void(WampError *error, MPNode, MPNode)> TCallCallback;


class WampMBED {
private:
    WampTransport &transport;
    std::random_device rd;
    std::mt19937_64 gen;
    MsgPack mp;
    unordered_map <WampID_t, TSubscriptionCallback> subscriptionsRequests;
    unordered_map <WampID_t, TSubscriptionCallback> subscriptions;
    unordered_map <WampID_t, TCallCallback> callRequests;
    unsigned long long int requestCount = 0;

    std::function<void()> onJoin {nullptr};



public:
    WampID_t sessionID;
    bool connected {false};
    std::function<void()> onClose {nullptr};

    WampMBED(WampTransport &transport);
    void connect();
    void connect(std::function<void()> onJoin);
    void connect(std::function<void()> onJoin, std::function<void()> onError);
    void close();

    void hello(string realm);
    void subscribe(string topic, TSubscriptionCallback callback);
    void publish(string const &topic);
    void publish(string const &topic, const MsgPack& arguments, const MsgPack& argumentsKW);
    void call(string const &procedure, const MsgPack& arguments,
              const MsgPack& argumentsKW, TCallCallback cb);

    void parseMessage(char *buffer, size_t size);

};

#endif //CPPWAMP_WAMPMBED_H
