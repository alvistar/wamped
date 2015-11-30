//
// Created by Alessandro Viganò on 24/11/15.
//

#include "MsgUnpack.h"
#include "MpackPrinter.h"
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

std::string MPNode::toJson() {
    MpackPrinter printer(node);
    return printer.toJSON();
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
