//
// Created by Alessandro Viganò on 16/11/15.
//

#include <random>
#include <msgpack/object.h>
#include <iostream>
#include "WampMBED.h"
#include "WampTransport.h"
#include "wampConstants.h"

#include "MsgUnpack.h"

#define LOG_(LEVEL) std::cout

WampMBED::WampMBED(WampTransport &transport):transport(transport) {



    gen = std::mt19937_64 (rd());


    this->transport.onConnect = [this]() {
        LOG_(INFO) << "Wamp Connected";
        this->hello("realm1");
    };

    this->transport.onClose = [this]() {
        //close();
    };

    this->transport.onMessageBin = [this](char *buffer, size_t size) {
        this->parseMessage(buffer, size);
    };
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
    mp.print();

    this->transport.sendMessage(mp.sbuf.data, mp.sbuf.size);


    //WSDictM roles {{"subscriber", WSDictM()}};
    //WSDictM details {{"roles", move(roles)}};
    //WSArrayM arr {(int) WAMP_MSG_HELLO, realm, details};
    //string msg = arr.toString();

    //this->transport.sendMessage(msg);
}

void WampMBED::subscribe(string topic, TSubscriptionCallback callback) {
    unsigned long long int id = random();

    subscriptionsRequests[id] = callback;

    mp.clear();
    mp.pack_array(4);
    //#ID
    mp.pack((int) WAMP_MSG_SUBSCRIBE);
    mp.pack(id);
    mp.pack_map(0);
    mp.pack(topic);
    mp.print();

    this->transport.sendMessage(mp.sbuf.data, mp.sbuf.size);
}


void WampMBED::parseMessage(char* buffer, size_t size) {
    LOG_(INFO) << "Received msg";
    int msgType = 0;

    MsgUnpack d {buffer, size};
    d.next();
    msgpack_object obj = d.getObj();
    //Deserializer d;
    if (obj.type != MSGPACK_OBJECT_ARRAY) {
        LOG_ (ERROR) << "Unknown msg";
        return;
    }

    msgType = (int) obj.via.array.ptr[0].via.u64;

    LOG_ (INFO) << "Msg type:" << msgType;
    switch (msgType) {
        case WAMP_MSG_WELCOME: {
            sessionID = (int) obj.via.array.ptr[1].via.u64;
            LOG_(INFO) << "Received welcome message with SessionID " << sessionID;
            connected = true;
            onJoin();
            break;
        }
    }
}