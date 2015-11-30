//
// Created by Alessandro Viganò on 24/11/15.
//

#ifndef WAMP_MBED_MSGUNPACK_H
#define WAMP_MBED_MSGUNPACK_H


#include <stddef.h>
#include "mpack/mpack-node.h"
#include <string>

class MPNode {
private:

public:
    mpack_node_t node;
    MPNode(mpack_node_t node):node(node){};
    MPNode();

    MPNode operator[](const u_int16_t &index);
    MPNode at(const u_int16_t &index, bool ignore_errors=false);
    mpack_error_t getError() {
        return node.tree->error;
    }

    size_t arrayLength ();
    std::string toJson();

    operator std::string();

    operator int() {
        return mpack_node_i16(node);
    }

    operator u_int16_t () {
        return mpack_node_u16(node);
    }

    operator unsigned long long int() {
        return mpack_node_u64(node);
    }
};

class MsgUnpack {
private:
    mpack_tree_t tree;
public:
    MsgUnpack(char* buffer, size_t size);
    ~MsgUnpack();

    MPNode getRoot();
    MPNode nil() {
        return MPNode(mpack_node(&tree, &tree.nil_node));
    };

    mpack_error_t getError();


};




#endif //WAMP_MBED_MSGUNPACK_H
