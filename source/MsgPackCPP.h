//
// Created by Alessandro Viganò on 16/11/15.
//
#include <string>
#include "mpack/mpack.h"

#ifndef CPPWAMP_MSGPACK_H
#define CPPWAMP_MSGPACK_H


class MsgPack {
private:
    mpack_writer_t writer;
    char data[1024];
public:
    MsgPack();


    void pack_array(uint32_t number);
    void pack_map(uint32_t n);
    void pack(std::string s);
    void pack(int i);
    void pack(MsgPack mp);
    void print();
    void clear();
    void pack(unsigned long long int i);
    size_t getUsedBuffer();
    char* getData();
    std::string getJson();
    void elemenToJson(mpack_node_t node, std::stringstream &s);
};


#endif //CPPWAMP_MSGPACK_H
