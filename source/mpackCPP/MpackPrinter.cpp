//
// Created by Alessandro Viganò on 24/11/15.
//

#include "MpackPrinter.h"

MpackPrinter::MpackPrinter(mpack_node_t node): node(node) {

}

void MpackPrinter::nodeToJson(mpack_node_t node) {
    mpack_node_data_t* data = node.data;
    switch (data->type) {

        case mpack_type_nil:
            s << "null";
            break;
        case mpack_type_bool:
            s << (data->value.b ? "true" : "false");
            break;

        case mpack_type_float:
            s << data->value.f;
            break;
        case mpack_type_double:
            s << data -> value.d;
            break;

        case mpack_type_int:
            s << data -> value.i;
            break;
        case mpack_type_uint:
            s << data->value.u;
            break;

        case mpack_type_bin:
            s << "<binary data of length " << data->value.data.l << ">";
            break;

        case mpack_type_ext:
            s << "<ext data of type " <<  data->exttype << " and length " << data->value.data.l << ">";
            break;

        case mpack_type_str:
        {
            s << "\"" ;

            const char* bytes = mpack_node_data(node);
            for (size_t i = 0; i < data->value.data.l; ++i) {
                char c = bytes[i];
                switch (c) {
                    case '\n': s << "\\n"; break;
                    case '\\': s << "\\\\"; break;
                    case '"': s <<  "\\\""; break;
                    default: s << c; break;
                }
            }
            s << "\"" ;
        }
            break;

        case mpack_type_array:
            s << "[";
            for (size_t i = 0; i < data->value.content.n; ++i) {
                nodeToJson(mpack_node_array_at(node, i));
                if (i != data->value.content.n - 1)
                    s << ',';
            }
            s << ']';
            break;

        case mpack_type_map:
            s << "{";
            for (size_t i = 0; i < data->value.content.n; ++i) {
                nodeToJson(mpack_node_map_key_at(node, i));
                s << ":";
                nodeToJson(mpack_node_map_value_at(node, i));
                if (i != data->value.content.n - 1)
                    s << ',';
            }

            s << '}';
            break;
    }
}



std::string MpackPrinter::toJSON() {
    s.clear();
    nodeToJson(node);
    return s.str();
}
