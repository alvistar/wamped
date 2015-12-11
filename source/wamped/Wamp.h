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

#ifndef CPPWAMP_WAMPMBED_H
#define CPPWAMP_WAMPMBED_H

#include <random>
#include <unordered_map>
#include "WampTransport.h"
#include "mpackCPP/MsgPack.h"
#include "mpack/mpack.h"
#include "mpackCPP/MsgUnpack.h"
#include "RegisteredProcedures.h"
#include "wampConstants.h"

typedef unsigned long long int WampID_t;
typedef const std::string& URI;
typedef function<void(const MPNode&,  const MPNode&)> TSubscriptionCallback;
typedef function<void(URI err, const MPNode&, const MPNode&)> TCallCallback;
typedef function<void(URI err)> TRegisterCallback;

typedef struct TRegisterRequest{
    RegisteredProcedureBase* registeredProcedure;
    TRegisterCallback registerCallback;
} TRegistrationRequest;

class Wamp {
private:
    WampTransport &transport;
    std::random_device rd;
    std::mt19937_64 gen;
    MsgPack mp;
    unordered_map <WampID_t, TSubscriptionCallback> subscriptionsRequests;
    unordered_map <WampID_t, TSubscriptionCallback> subscriptions;
    unordered_map <WampID_t, TCallCallback> callRequests;
    unordered_map <WampID_t, TRegisterRequest> registrationsRequests;
    unordered_map <WampID, RegisteredProcedureBase*> registrations;
    unsigned long long int requestCount = 0;
    std::function<void()> onJoin {nullptr};

    void hello(string realm);

    void yield(const WampID_t& invocationID, const MsgPack& arguments);
    void yield(const WampID_t& invocationID);

    void sendError (const enum wamp_messages &msgType,
                    const std::string &errorURI,
                    const WampID_t &requestID,
                    const MsgPack &details,
                    const MsgPack &arguments,
                    const MsgPack &argumentsKW
    );

    void loggedSend (const std::string & msg);

public:
    WampID_t sessionID;
    bool connected {false};
    std::function<void()> onClose {nullptr};

    Wamp(WampTransport &transport);
    void connect();
    void connect(std::function<void()> onJoin);
    void connect(std::function<void()> onJoin, std::function<void()> onError);
    void close();
    void subscribe(string topic, TSubscriptionCallback callback);
    void publish(string const &topic);
    void publish(string const &topic, const MsgPack& arguments, const MsgPack& argumentsKW);

    void call(string const &procedure, const MsgPack& arguments,
              const MsgPack& argumentsKW, TCallCallback cb);
    void parseMessage(char *buffer, size_t size);

    template <typename ...ARGS>
    void pub(string const &topic, ARGS&& ... args) {
        if (!connected)
            return;

        mp.clear();
        mp.pack_array(5);
        mp.pack((int) WAMP_MSG_PUBLISH);
        mp.pack(requestCount);
        mp.pack_map(0);
        mp.pack(topic);
        mp.packArray(std::forward<ARGS>(args)...);

        loggedSend("PUBLISH");
        requestCount++;

    }

    template <typename Func>
    void registerProcedure (const string& procedure, Func f, TRegisterCallback callback = nullptr) {

        TRegistrationRequest registrationRequest;
        registrationRequest.registeredProcedure = make_RegisteredProcedure(f);
        registrationRequest.registerCallback = callback;

        registrationsRequests[requestCount] =  registrationRequest;

        mp.clear();
        mp.pack_array(4);
        mp.pack((int) WAMP_MSG_REGISTER);
        mp.pack(requestCount);
        mp.pack_map(0);
        mp.pack(procedure);

        loggedSend("REGISTER");
        requestCount++;
    }

};

#endif //CPPWAMP_WAMPMBED_H
