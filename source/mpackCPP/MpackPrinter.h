//
// Created by Alessandro Viganò on 24/11/15.
//

#include "mpack/mpack.h"
#include <sstream>

#ifndef WAMP_MBED_MPACKPRINTER_H
#define WAMP_MBED_MPACKPRINTER_H


class MpackPrinter {
private:
    std::stringstream s;
    mpack_node_t node;
public:
    MpackPrinter(mpack_node_t node);
    void nodeToJson(mpack_node_t node);
    std::string toJSON ();
};


#endif //WAMP_MBED_MPACKPRINTER_H
