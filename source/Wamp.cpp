//
// Created by Alessandro Viganò on 16/11/15.
//

#include <random>
#include <iostream>
#include "Wamp.h"
#include "WampTransport.h"
#include "wampConstants.h"

#include "MsgUnpack.h"



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

void WampMBED::call(string const &procedure, const MsgPack &arguments, const MsgPack &argumentsKW, TCallCallback cb) {
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

    LOG ("Calling " << procedure << "- " << mp.getJson());

    requestCount++;

    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());
}

void WampMBED::yield(const WampID_t &invocationID, const MsgPack &arguments, const MsgPack &argumentsKW) {
    mp.clear();
    mp.pack_array(5);
    mp.pack((int) WAMP_MSG_YIELD);
    mp.pack(invocationID);
    mp.pack_map(0);
    mp.pack(arguments);
    mp.pack(argumentsKW);

    LOG ("Yielding  " << mp.getJson());

    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());
}

void WampMBED::sendError(const enum wamp_messages &msgType, const std::string &errorURI, const WampID_t &requestID,
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

    LOG ("sending error  " << mp.getJson());
    this->transport.sendMessage(mp.getData(), mp.getUsedBuffer());

}


void WampMBED::parseMessage(char* buffer, size_t size) {

    int msgType = 0;

    MsgUnpack munp(buffer,size);
    MPNode root = munp.getRoot();
    LOG ("Received msg "<< root.toJson());

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

            auto procedure = registrationsRequests.at(requestID);
            registrations[registrationID] = procedure;
            registrationsRequests.erase(requestID);
            LOG("Active registrations " << registrations.size());

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
            MPNode kwargs = root.at(5, true);

            LOG("Received INVOCATION message");

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
            yield(requestID, MsgPackArr {result}, MsgPackMap {});
//
//                try {
//
//                    yield(requestID, WSArrayM {result});
//                }
//                catch (WampException &e) {
//                    LOG_(ERROR) << e.what();
//                    WSDictM details {};
//                    error(WAMP_MSG_INVOCATION,"wamp.error.invalid_argument", requestID, details);
//                }
//            }
//            catch (out_of_range) {
//                LOG_(DEBUG) << "RegistrationID not found";
//            }

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
            cb(nullptr, args, kwargs);

            break;
        }

        case WAMP_MSG_ERROR: {
            u_int16_t errMsg = root[1];

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
                    WampError e {err};
                    cb(&e, munp.nil(), munp.nil());
                    break;

                }
                default:
                    LOG("Uknown erorr");
            }
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



