//
// Created by Alessandro Viganò on 24/11/15.
//

#include "MsgUnpack.h"
#include "MpackPrinter.h"
#include <sstream>

MsgUnpack::MsgUnpack(char *buffer, size_t size) {
    mpack_tree_init(&tree, buffer, size);
}

MsgUnpack::~MsgUnpack() {
    mpack_tree_destroy(&tree);
}

mpack_node_t MsgUnpack::getRoot() {
    return mpack_tree_root(&tree);
}

mpack_error_t MsgUnpack::getError() {
    return tree.error;
}

std::string MsgUnpack::toJson() {
    MpackPrinter printer(getRoot());
    return printer.toJSON();

}
