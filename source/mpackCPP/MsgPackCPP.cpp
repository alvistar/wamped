//
// Created by Alessandro Viganò on 16/11/15.
//

#include "MsgPackCPP.h"
#include "MsgUnpack.h"
#include "mpack/mpack.h"
#include <sstream>

MsgPack::MsgPack() {
    mpack_writer_init(&writer, data, sizeof(data));
}

void MsgPack::pack_array(uint32_t number) {
    mpack_start_array(&writer, number);
}

void MsgPack::pack(std::string s) {
    mpack_write_cstr(&writer, s.c_str());
}

void MsgPack::print() {
    mpack_tree_t tree;
    mpack_tree_init(&tree, data, mpack_writer_buffer_used(&writer));
    mpack_node_t root = mpack_tree_root(&tree);
    mpack_node_print (root);
}

void MsgPack::clear() {
    mpack_writer_init(&writer, data, sizeof(data));
}

void MsgPack::pack(int i) {
    mpack_write_i16(&writer, i);
}

void MsgPack::pack(unsigned long long int i) {
    mpack_write_u64(&writer, i);
}

void MsgPack::pack_map(uint32_t n) {
    mpack_start_map(&writer, n);
}

size_t MsgPack::getUsedBuffer() {
    return mpack_writer_buffer_used(&writer);
}

char *MsgPack::getData() {
    return data;
}

void MsgPack::pack(MsgPack mp) {
    mpack_write_bytes(&writer, mp.getData(),mp.getUsedBuffer());
}

std::string MsgPack::getJson() {
    MsgUnpack unp {getData(), getUsedBuffer()};
    return unp.getRoot().toJson();
}

