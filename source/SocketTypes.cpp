#include "SocketTypes.h"

namespace spal {
    std::string getError(error err) {
        switch (err) {
            case CONNREFUSED:
                return "Connection Refused";
            case SOCKETNOTCONNECTED:
                return "Socket not connected";
            default:
                return "Unkwon error";
        }
    };
};