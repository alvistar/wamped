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

#ifndef WAMP_MBED_MSGUNPACK_H
#define WAMP_MBED_MSGUNPACK_H


#include <stddef.h>
#include <stdint.h>
#include "mpack/mpack-node.h"
#include <string>

class MPNode {
private:
    static void _getJson(std::stringstream &s, const mpack_node_t &node);

public:
    mpack_node_t node;
    MPNode(mpack_node_t node):node(node){};

    MPNode operator[](const uint16_t  &index);
    MPNode at(const uint16_t   &index, bool ignore_errors=false);
    mpack_error_t getError() {
        return node.tree->error;
    }

    mpack_type_t type() {
        return mpack_node_type(node);
    }

    bool isNil() {
        return mpack_node_type(node) == mpack_type_nil;
    }

    size_t arrayLength ();
    std::string getJson() const;

    operator std::string();

    operator int() {
        return mpack_node_i16(node);
    }

    operator uint16_t  () {
        return mpack_node_u16(node);
    }

    operator unsigned long long int() {
        return mpack_node_u64(node);
    }

    friend std::ostream &operator << (std::ostream &os, const MPNode &o) {
        return os << o.getJson();
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
