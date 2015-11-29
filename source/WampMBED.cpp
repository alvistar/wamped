//
// Created by Alessandro Viganò on 16/11/15.
//

#define DEBUGWAMP

#include <random>
#include <iostream>
#include "WampMBED.h"
#include "WampTransport.h"
#include "wampConstants.h"

#include "MsgUnpack.h"

#ifdef DEBUGWAMP
#include "logger.h"
#else
#define LOG(X)
#endif

WampMBED::WampMBED(WampTransport &transport):transport(transport) {

    gen = std::mt19937_64 (rd());

    this->transport.onConnect = [this]() {
        LOG ("Wamp Connected");
        this->hello("realm1");
    };

    this->transport.onClose = [this]() {
        close();
    };

    this->transport.onMessageBin = [this](char *buffer, size_t size) {
        this->parseMessage(buffer, size);
    };
}

void WampMBED::connect() {
    transport.connect();
}

void WampMBED::connect(std::function<void()> onJoin) {
    this->onJoin = onJoin;

    transport.connect();
}

void WampMBED::connect(std::function<void()> onJoin, std::function<void()> onError) {
    transport.onConnectError = onError;
    connect (onJoin);
}

void WampMBED::hello(string realm) {
    mp.clear();
    mp.pack_array(3);
    mp.pack((int) WAMP_MSG_HELLO);
    mp.pack(realm);
    //Details
    mp.pack_map(1);
    mp.pack("roles");
    //Roles
    mp.pack_map(1);
    mp.pack("subscriber");
    mp.pack_map(0);
    LOG("Sending Hello: " << mp.getJson());

    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());


    //WSDictM roles {{"subscriber", WSDictM()}};
    //WSDictM details {{"roles", move(roles)}};
    //WSArrayM arr {(int) WAMP_MSG_HELLO, realm, details};
    //string msg = arr.toString();

    //this->transport.sendMessage(msg);
}

void WampMBED::subscribe(string topic, TSubscriptionCallback callback) {
    //unsigned long long int id = random();

    subscriptionsRequests[requestCount] = callback;

    mp.clear();
    mp.pack_array(4);
    //#ID
    mp.pack((int) WAMP_MSG_SUBSCRIBE);
    mp.pack(requestCount);
    mp.pack_map(0);
    mp.pack(topic);
    LOG ("Subscribing to " << topic << ": " << mp.getJson() );

    requestCount++;

    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());
}

void WampMBED::publish(string const &topic) {
    if (!connected)
        return;

    mp.clear();
    mp.pack_array(4);
    mp.pack((int) WAMP_MSG_PUBLISH);
    mp.pack(requestCount);
    mp.pack_map(0);
    mp.pack(topic);
    LOG ("Publishing to " << topic << "- " << mp.getJson());

    requestCount++;

    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());
};

void WampMBED::publish(string const &topic, const MsgPack& arguments, const MsgPack& argumentsKW) {
    if (!connected)
        return;

    mp.clear();
    mp.pack_array(6);
    mp.pack((int) WAMP_MSG_PUBLISH);
    mp.pack(requestCount);
    mp.pack_map(0);
    mp.pack(topic);
    mp.pack(arguments);
    mp.pack(argumentsKW);

    LOG ("Publishing to " << topic << "- " << mp.getJson());

    requestCount++;

    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());
}

void WampMBED::parseMessage(char* buffer, size_t size) {

    int msgType = 0;

    MsgUnpack munp(buffer,size);
    mpack_node_t root = munp.getRoot();
    LOG ("Received msg "<< munp.toJson());

    msgType = mpack_node_u16(mpack_node_array_at(root,0));

    if (munp.getError() != mpack_ok) {
        LOG ("Unknown msg");
        return;
    }

    LOG ("Msg type:" << msgType);
    switch (msgType) {
        case WAMP_MSG_WELCOME: {
            sessionID = mpack_node_u64(mpack_node_array_at(root,1));
            LOG ("Received welcome message with SessionID " << sessionID);
            connected = true;
            onJoin();
            break;
        }
        case WAMP_MSG_SUBSCRIBED: {
            unsigned long long int requestID = mpack_node_u64(mpack_node_array_at(root,1));
            unsigned long long int subscriptionID = mpack_node_u64(mpack_node_array_at(root,2));

            if (munp.getError() != mpack_ok) {
                LOG ("Bad Subscribe Message");
                return;
            }

            LOG ("Received SUBSCRIBED message with SubscriptionID " << subscriptionID);

            if (subscriptionsRequests.find(requestID) == subscriptionsRequests.end()) {
                LOG ("SubscriptionRequest not found");
                return;
            }

            TSubscriptionCallback cb = subscriptionsRequests.at(requestID);
            subscriptions[subscriptionID] = cb;
            subscriptionsRequests.erase(requestID);
            LOG ("Active subscriptions " << subscriptions.size());

            break;
        }

        case WAMP_MSG_EVENT: {

            unsigned long long int subscriptionID = mpack_node_u64(mpack_node_array_at(root,1));

            if (munp.getError() != mpack_ok) {
                LOG ("Bad EVENT Message");
                return;
            }

            mpack_node_t args;
            mpack_node_t kwargs;

            if (mpack_node_array_length(root) >4) {
                args = mpack_node_array_at(root, 4);
            }
            else {
                args.data = nullptr;
                args.tree = nullptr;
            }

            if (mpack_node_array_length(root) >5) {
               kwargs = mpack_node_array_at(root, 5);
            }
            else {
                kwargs.data = nullptr;
                kwargs.tree = nullptr;
            }

            LOG ("Received EVENT message with SubscriptionID " << subscriptionID);

            if (subscriptions.find(subscriptionID) == subscriptionsRequests.end()) {
                LOG ("SubscriptionID not found - # Subscriptions" << subscriptions.size());
                return;
            }

            TSubscriptionCallback cb = subscriptions.at(subscriptionID);

            cb(args, kwargs);

            break;
        }

    }
}

void WampMBED::close() {
    LOG("Wamp Closed Connection");
    connected = false;
    subscriptionsRequests.clear();
    subscriptions.clear();
    if (onClose)
        onClose();
}
