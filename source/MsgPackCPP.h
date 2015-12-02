//
// Created by Alessandro Viganò on 16/11/15.
//


#include <string>
#include <sys/types.h>
#include <utility>
#include "mpack/mpack.h"

#ifndef CPPWAMP_MSGPACK_H
#define CPPWAMP_MSGPACK_H

#define MPARR(X) MComp {mpArr, X}
#define MPMAP(X) MComp {mpMap, X}


class MsgPack {
private:
    mpack_writer_t writer;
    char data[1024];

    void packAll() {

    }

    template <typename A>
    void packAll (A&& p1){
        pack(p1);
    };

    template <typename A, typename ...B>
    void packAll (A&& p1, B&&... params) {
        packAll (std::forward<A> (p1));
        packAll (std::forward<B>(params)...);
    };

public:
    MsgPack();
    MsgPack(int i):MsgPack() {
        pack(i);
    }

    MsgPack(std::string s):MsgPack() {
        pack(s);
    }

    bool isEmpty() {
        return mpack_writer_buffer_used(&writer) == 0;
    }

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

    template <typename ...ITEMS>
    void packArray(ITEMS&&... items) {
        uint elements = uint(sizeof ...(items));
        pack_array(elements);
        packAll(std::forward<ITEMS>(items)...);
    };

    template <typename T>
    MsgPack& operator << (const T& data) {
        pack(data);
        return *this;
    }
};

class MsgPackArr: public MsgPack {
private:
    void packAll() {

    }

    template <typename A>
    void packAll (A&& p1){
        pack(p1);
    };

    template <typename A, typename ...B>
    void packAll (A&& p1, B&&... params) {
        packAll (std::forward<A> (p1));
        packAll (std::forward<B>(params)...);
    };

public:

    template <typename ...A>
    MsgPackArr(A&&... params) {
        uint elements = uint(sizeof ...(A));
        pack_array(elements);
        packAll(std::forward<A>(params)...);
    }


};

class MsgPackMap: public MsgPack {
private:
    void packAll() {
    }

    template <typename A>
    void packAll (A&& p1){
        pack(p1);
    };

    template <typename A, typename ...B>
    void packAll (A&& p1, B&&... params)
    {
        packAll (std::forward<A> (p1));
        packAll (std::forward<B>(params)...);
    };
public:

    template <typename ...A>
    MsgPackMap(A&&... params) {
        uint elements = (uint(sizeof ...(A)))/2;
        pack_map(elements);
        packAll(std::forward<A>(params)...);
    }
};


#endif //CPPWAMP_MSGPACK_H
