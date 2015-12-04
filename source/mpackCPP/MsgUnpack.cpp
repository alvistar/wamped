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

#include "MsgUnpack.h"
#include <sstream>
#include <string>
#include <memory>

MsgUnpack::MsgUnpack(char *buffer, size_t size) {
    mpack_tree_init(&tree, buffer, size);
}

MsgUnpack::~MsgUnpack() {
    mpack_tree_destroy(&tree);
}

MPNode MsgUnpack::getRoot() {
    return MPNode(mpack_tree_root(&tree));
}

mpack_error_t MsgUnpack::getError() {
    return tree.error;
}

void MPNode::_getJson(std::stringstream &s, const mpack_node_t &node) {
    mpack_node_data_t* data = node.data;
    switch (data->type) {

        case mpack_type_nil:
            s << "null";
            break;
        case mpack_type_bool:
            s << (data->value.b ? "true" : "false");
            break;

        case mpack_type_float:
            s << data->value.f;
            break;
        case mpack_type_double:
            s << data -> value.d;
            break;

        case mpack_type_int:
            s << data -> value.i;
            break;
        case mpack_type_uint:
            s << data->value.u;
            break;

        case mpack_type_bin:
            s << "<binary data of length " << data->value.data.l << ">";
            break;

        case mpack_type_ext:
            s << "<ext data of type " <<  data->exttype << " and length " << data->value.data.l << ">";
            break;

        case mpack_type_str:
        {
            s << "\"" ;

            const char* bytes = mpack_node_data(node);
            for (size_t i = 0; i < data->value.data.l; ++i) {
                char c = bytes[i];
                switch (c) {
                    case '\n': s << "\\n"; break;
                    case '\\': s << "\\\\"; break;
                    case '"': s <<  "\\\""; break;
                    default: s << c; break;
                }
            }
            s << "\"" ;
        }
            break;

        case mpack_type_array:
            s << "[";
            for (size_t i = 0; i < data->value.content.n; ++i) {
                _getJson(s,mpack_node_array_at(node, i));
                if (i != data->value.content.n - 1)
                    s << ',';
            }
            s << ']';
            break;

        case mpack_type_map:
            s << "{";
            for (size_t i = 0; i < data->value.content.n; ++i) {
                _getJson(s,mpack_node_map_key_at(node, i));
                s << ":";
                _getJson(s,mpack_node_map_value_at(node, i));
                if (i != data->value.content.n - 1)
                    s << ',';
            }

            s << '}';
            break;
    }
}

std::string MPNode::getJson() const {
    std::stringstream s;
    _getJson(s, node);
    return s.str();
}

MPNode MPNode::operator[](const uint16_t  &index) {
    return at(index);
}

MPNode MPNode::at(const uint16_t  &index, bool ignore_errors) {

    if (mpack_node_error(node) != mpack_ok)
        return MPNode(mpack_tree_nil_node(node.tree));

    if (node.data->type != mpack_type_array) {
        if (!ignore_errors)
            mpack_node_flag_error(node, mpack_error_type);

        return MPNode(mpack_tree_nil_node(node.tree));
    }

    if (index >= node.data->value.content.n) {
        if (!ignore_errors)
            mpack_node_flag_error(node, mpack_error_data);
        return MPNode(mpack_tree_nil_node(node.tree));
    }

    return MPNode(mpack_node(node.tree, mpack_node_child(node, index)));
}


size_t MPNode::arrayLength() {
    return mpack_node_array_length(node);
}

MPNode::operator std::string() {
    if (mpack_node_error(node) != mpack_ok) {
        return std::string();
    }

    if (node.data->type != mpack_type_str) {
        mpack_node_flag_error(node, mpack_error_type);
        return std::string();
    }

    return std::string(mpack_node_data(node), mpack_node_strlen(node));
}
