//
// Created by Alessandro Viganò on 17/11/15.
//

#include "MsgUnpack.h"

MsgUnpack::MsgUnpack(char *buffer, size_t size) {
    msgpack_unpacker_init(&up, MSGPACK_UNPACKER_INIT_BUFFER_SIZE);
    msgpack_unpacker_reserve_buffer(&up, size);
    memcpy(msgpack_unpacker_buffer(&up), buffer, size);
    msgpack_unpacker_buffer_consumed(&up, size);
    msgpack_unpacked_init(&result);
}

msgpack_unpack_return MsgUnpack::next() {
    return msgpack_unpacker_next(&up, &result);
}

msgpack_object MsgUnpack::getObj() {
    return result.data;
}
