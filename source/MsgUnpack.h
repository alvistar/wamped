//
// Created by Alessandro Viganò on 24/11/15.
//

#ifndef WAMP_MBED_MSGUNPACK_H
#define WAMP_MBED_MSGUNPACK_H


#include <stddef.h>
#include "mpack/mpack-node.h"
#include <string>

class MsgUnpack {
private:
    mpack_tree_t tree;
public:
    MsgUnpack(char* buffer, size_t size);
    ~MsgUnpack();

    mpack_node_t getRoot();
    mpack_error_t getError();
    std::string toJson();

    static void nodeToJson(mpack_node_t node, std::stringstream &s);
};


#endif //WAMP_MBED_MSGUNPACK_H
