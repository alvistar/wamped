//
// Created by Alessandro Viganò on 17/11/15.
//

#ifndef CPPWAMP_MSGUNPACK_H
#define CPPWAMP_MSGUNPACK_H


#include <stddef.h>
#include <msgpack/unpack.h>

class MsgUnpack {
private:
    msgpack_unpacker up;
    msgpack_unpacked result;
public:
    MsgUnpack(char* buffer, size_t size);
    msgpack_unpack_return next();
    msgpack_object getObj();
};


#endif //CPPWAMP_MSGUNPACK_H
