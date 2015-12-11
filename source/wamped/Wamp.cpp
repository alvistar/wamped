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

#include <random>
#include <iostream>
#include "Wamp.h"
#include "WampTransport.h"
#include "wampConstants.h"

#ifdef DEBUG_WAMP
#include "logger.h"
#else
#define LOG(X)
#endif

Wamp::Wamp(WampTransport &transport): transport(transport) {

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

void Wamp::connect() {
    transport.connect();
}

void Wamp::connect(std::function<void()> onJoin) {
    this->onJoin = onJoin;

    transport.connect();
}

void Wamp::connect(std::function<void()> onJoin, std::function<void()> onError) {
    transport.onConnectError = onError;
    connect (onJoin);
}

void Wamp::loggedSend(const std::string &msg) {
    LOG("Sending " << msg << ": " << mp.getJson());
    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());
}

void Wamp::hello(string realm) {
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
    loggedSend("HELLO");
}

void Wamp::subscribe(string topic, TSubscriptionCallback callback) {
    //unsigned long long int id = random();

    subscriptionsRequests[requestCount] = callback;

    mp.clear();
    mp.pack_array(4);
    //#ID
    mp.pack((int) WAMP_MSG_SUBSCRIBE);
    mp.pack(requestCount);
    mp.pack_map(0);
    mp.pack(topic);

    loggedSend("SUBSCRIBE");
    requestCount++;
}

void Wamp::publish(string const &topic) {
    if (!connected)
        return;

    mp.clear();
    mp.pack_array(4);
    mp.pack((int) WAMP_MSG_PUBLISH);
    mp.pack(requestCount);
    mp.pack_map(0);
    mp.pack(topic);

    loggedSend("PUBLISH");
    requestCount++;
}

void Wamp::publish(string const &topic, const MsgPack& arguments, const MsgPack& argumentsKW) {
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

    loggedSend("PUBLISH");
    requestCount++;
}


void Wamp::call(string const &procedure, const MsgPack &arguments, const MsgPack &argumentsKW, TCallCallback cb) {
    if (!connected)
        return;

    callRequests[requestCount] = cb;

    mp.clear();
    mp.pack_array(6);
    mp.pack((int) WAMP_MSG_CALL);
    mp.pack(requestCount);
    mp.pack_map(0);
    mp.pack(procedure);
    mp.pack(arguments);
    mp.pack(argumentsKW);

    loggedSend("CALL");
    requestCount++;
}

void Wamp::yield(const WampID_t &invocationID) {
    mp.clear();
    mp.pack_array(3);
    mp.pack((int) WAMP_MSG_YIELD);
    mp.pack(invocationID);
    mp.pack_map(0);

    loggedSend("Yielding");
}


void Wamp::yield(const WampID_t &invocationID, const MsgPack &arguments) {
    mp.clear();
    mp.pack_array(4);
    mp.pack((int) WAMP_MSG_YIELD);
    mp.pack(invocationID);
    mp.pack_map(0);
    mp.pack(arguments);

    loggedSend("Yielding");
}

void Wamp::sendError(const enum wamp_messages &msgType, const std::string &errorURI, const WampID_t &requestID,
                     const MsgPack &details, const MsgPack &arguments= MsgPackArr(), const MsgPack &argumentsKW = MsgPackMap()) {

    mp.clear();
    mp.pack_array(7);
    mp.pack((int) WAMP_MSG_ERROR);
    mp.pack((int) msgType);
    mp.pack(requestID),
    mp.pack(details);
    mp.pack(errorURI);
    mp.pack(arguments);
    mp.pack(argumentsKW);

    loggedSend("Error");

}


void Wamp::parseMessage(char* buffer, size_t size) {

    int msgType = 0;

    MsgUnpack munp(buffer,size);
    MPNode root = munp.getRoot();
    LOG ("Received msg "<< root);

    //msgType = mpack_node_u16(mpack_node_array_at(root,0));
    msgType = root[0];

    if (munp.getError() != mpack_ok) {
        LOG ("Unknown msg");
        return;
    }

    LOG ("Msg type:" << msgType);
    switch (msgType) {
        case WAMP_MSG_WELCOME: {
            //sessionID = mpack_node_u64(mpack_node_array_at(root,1));
            sessionID = root[1];
            LOG ("Received welcome message with SessionID " << sessionID);
            connected = true;
            onJoin();
            break;
        }
        case WAMP_MSG_SUBSCRIBED: {
            WampID_t requestID = root[1];
            WampID_t subscriptionID = root[2];

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

        case WAMP_MSG_REGISTERED: {
            WampID_t requestID = root[1];
            WampID_t registrationID = root[2];

            if (munp.getError() != mpack_ok) {
                LOG ("Bad Subscribe Message");
                return;
            }

            LOG("Received Registered message with RegistrationID " << registrationID);

            if (registrationsRequests.find(requestID) == registrationsRequests.end()) {
                LOG ("SubscriptionRequest not found");
                return;
            }

            auto registrationRequest = registrationsRequests.at(requestID);
            registrations[registrationID] = registrationRequest.registeredProcedure;
            registrationsRequests.erase(requestID);
            LOG("Active registrations " << registrations.size());

            if (registrationRequest.registerCallback)
                registrationRequest.registerCallback(std::string());

            break;

        };

        case WAMP_MSG_INVOCATION: {
            WampID_t requestID = root[1];
            WampID_t registrationID = root[2];

            if (munp.getError() != mpack_ok) {
                LOG ("Bad Invocation Message");
                return;
            }

            MPNode args = root.at(4, true);
            //MPNode kwargs = root.at(5, true);

            LOG("Received INVOCATION message for registered procedure "<< registrationID);

            if (registrations.find(registrationID) == registrations.end()) {
                LOG ("Registration not found");
                return;
            }

            auto procedure = registrations.at(registrationID);

            if (!procedure->check(args)) {
                sendError(WAMP_MSG_INVOCATION, "wamp.error.invalid_argument", requestID, MsgPackMap());
                return;
            }

            MsgPack result = procedure->invoke(args);

            LOG("Result:" << result.getJson());

            if (result.isEmpty())
                yield(requestID);
            else
                yield(requestID, MsgPackArr {result});

            break;
        };

        case WAMP_MSG_EVENT: {

            WampID_t subscriptionID = root[1];

            if (munp.getError() != mpack_ok) {
                LOG ("Bad EVENT Message");
                return;
            }

            MPNode args = root.at(4, true);
            MPNode kwargs = root.at(5, true);

            LOG ("Received EVENT message with SubscriptionID " << subscriptionID);

            if (subscriptions.find(subscriptionID) == subscriptionsRequests.end()) {
                LOG ("SubscriptionID not found - # Subscriptions" << subscriptions.size());
                return;
            }

            TSubscriptionCallback cb = subscriptions.at(subscriptionID);

            cb(args, kwargs);

            break;
        }

        case WAMP_MSG_RESULT:
        {
            WampID_t requestID = root[1];
            if (munp.getError() != mpack_ok) {
                LOG ("Bad RESULT Message");
                return;
            }

            MPNode args = root.at(3, true);
            MPNode kwargs = root.at(4, true);


            LOG ("Received RESULT message with requestID " << requestID);

            if (callRequests.find(requestID) == callRequests.end()) {
                LOG ("RequestID not found - # Subscriptions" << subscriptions.size());
                return;
            }

            TCallCallback cb = callRequests.at(requestID);
            cb(std::string(), args, kwargs);

            break;
        }

        case WAMP_MSG_ERROR: {
            uint16_t   errMsg = root[1];

            switch (errMsg) {
                case WAMP_MSG_CALL: {
                    std::string err = root[4];
                    WampID_t callRequest = root[2];

                    if (munp.getError() != mpack_ok) {
                        LOG ("Bad ERROR Message");
                        return;
                    }

                    if (callRequests.find(callRequest) == callRequests.end()) {
                        LOG ("RequestID not found - # CallRequests" << callRequests.size());
                        return;
                    }

                    LOG("Received error for CALL request "<< callRequest);
                    TCallCallback cb = callRequests.at(callRequest);
                    callRequests.erase(callRequest);
                    cb(err, munp.nil(), munp.nil());
                    break;

                }
                case WAMP_MSG_REGISTER: {
                    std::string err = root[4];
                    WampID_t registerRequest = root[2];

                    if (munp.getError() != mpack_ok) {
                        LOG ("Bad ERROR Message");
                        return;
                    }

                    if (registrationsRequests.find(registerRequest) == registrationsRequests.end()) {
                        LOG ("RequestID not found - # RegistrationsRequests" << registrationsRequests.size());
                        return;
                    }

                    LOG("Received error for Register request "<< registerRequest);
                    TRegisterCallback cb = registrationsRequests.at(registerRequest).registerCallback;
                    registrationsRequests.erase(registerRequest);
                    if(cb)
                        cb(err);
                    break;

                }
                default:
                    LOG("Uknown erorr");


            }
        }


    }
}

void Wamp::close() {
    LOG("Wamp Closed Connection");
    connected = false;
    subscriptionsRequests.clear();
    subscriptions.clear();
    if (onClose)
        onClose();
}
