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

#include "MsgPack.h"
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

size_t MsgPack::getUsedBuffer() const {
    return mpack_writer_buffer_used((mpack_writer_t*)&writer);
}

char *MsgPack::getData() const{
    return (char*) data;
}

void MsgPack::pack(MsgPack mp) {
    mpack_write_bytes(&writer, mp.getData(),mp.getUsedBuffer());
}

void MsgPack::_getJson(std::stringstream &s, mpack_reader_t &reader) const {
    mpack_tag_t val = mpack_read_tag(&reader);
    if (mpack_reader_error(&reader) != mpack_ok) {
        s.clear();
        return;
    }

    switch (val.type) {
        case mpack_type_nil:
            s << "null";
            break;
        case mpack_type_bool:
            val.v.b ? s << "true" : s << "false";
            break;

        case mpack_type_float:
            s << val.v.f;
            break;
        case mpack_type_double:
            s << val.v.d;
            break;

        case mpack_type_int:
            s << val.v.i;
            break;
        case mpack_type_uint:
            s << val.v.u;
            break;

        case mpack_type_bin:
            s << "<binary data of length " << val.v.l << " > ";
            mpack_skip_bytes(&reader, val.v.l);
            mpack_done_bin(&reader);
            break;

        case mpack_type_ext:
            s << "<ext data of type " << val.exttype << " and length " << val.v.l << ">";
            mpack_skip_bytes(&reader, val.v.l);
            mpack_done_ext(&reader);
            break;

        case mpack_type_str:
            s << '"';
            for (size_t i = 0; i < val.v.l; ++i) {
                char c;
                mpack_read_bytes(&reader, &c, 1);
                if (mpack_reader_error(&reader) != mpack_ok) {
                    s.clear();
                    return;
                }
                switch (c) {
                    case '\n':
                        s << "\\n";
                        break;
                    case '\\':
                        s << "\\\\";
                        break;
                    case '"':
                        s << "\\\"";
                        break;
                    default:
                        s << c;
                        break;
                }
            }
            s << '"';
            mpack_done_str(&reader);
            break;

        case mpack_type_array:
            s << "[";
            for (size_t i = 0; i < val.v.n; ++i) {
                _getJson(s, reader);
                if (mpack_reader_error(&reader) != mpack_ok) {
                    s.clear();
                    return;
                }
                if (i != val.v.n - 1)
                    s << ',';
            }
            s << ']';
            mpack_done_array(&reader);
            break;

        case mpack_type_map:
            s << "{";
            for (size_t i = 0; i < val.v.n; ++i) {
                _getJson(s, reader);
                if (mpack_reader_error(&reader) != mpack_ok) {
                    s.clear();
                    return;
                }
                s << ": ";
                _getJson(s, reader);

                if (mpack_reader_error(&reader) != mpack_ok) {
                    s.clear();
                    return;
                }

                if (i != val.v.n - 1)
                    s << ",";
            }
            s<< ('}');
            mpack_done_map(&reader);
            break;
    }
}
std::string MsgPack::getJson() const {
    mpack_reader_t reader;
    mpack_reader_init_data(&reader,getData(), getUsedBuffer());
    std::stringstream s;
    _getJson(s, reader);
    return s.str();
}


