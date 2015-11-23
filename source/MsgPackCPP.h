//
// Created by Alessandro Viganò on 16/11/15.
//
#include <string>
#include "msgpack.h"

#ifndef CPPWAMP_MSGPACK_H
#define CPPWAMP_MSGPACK_H


class MsgPack {
private:
    msgpack_packer pk;
public:
    MsgPack();
    msgpack_sbuffer sbuf;
    void pack_array(size_t number);
    void pack_map(size_t n);
    void pack(std::string s);
    void pack(int i);
    void print();
    void clear();

    void pack(unsigned long long int i);
};


#endif //CPPWAMP_MSGPACK_H
