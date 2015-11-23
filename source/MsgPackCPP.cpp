//
// Created by Alessandro Viganò on 16/11/15.
//

#include "MsgPackCPP.h"

MsgPack::MsgPack() {
    msgpack_sbuffer_init(&sbuf);
    msgpack_packer_init(&pk, &sbuf, msgpack_sbuffer_write);
}

void MsgPack::pack_array(size_t number) {
    msgpack_pack_array(&pk, number);
}

void MsgPack::pack(std::string s) {
    msgpack_pack_str(&pk, s.length());
    msgpack_pack_str_body(&pk, s.c_str(), s.length());
}

void MsgPack::print() {
    msgpack_zone mempool;
    msgpack_zone_init(&mempool, 2048);

    msgpack_object deserialized;
    msgpack_unpack(sbuf.data, sbuf.size, NULL, &mempool, &deserialized);
    msgpack_object_print(stdout, deserialized);
    msgpack_zone_destroy(&mempool);
}

void MsgPack::clear() {
    msgpack_sbuffer_clear(&sbuf);
}

void MsgPack::pack(int i) {
    msgpack_pack_int(&pk, i);
}

void MsgPack::pack(unsigned long long int i) {
    msgpack_pack_uint64(&pk,i);
}

void MsgPack::pack_map(size_t n) {
    msgpack_pack_map(&pk, n);
}
