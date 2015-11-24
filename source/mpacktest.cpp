#include "mpack/mpack.h"
#include "MsgPackCPP.h"
#include "logger.h"

int main() {
    MsgPack mp;
    mp.clear();
    mp.pack_array(3);
    mp.pack((int) 1);
    mp.pack("realm1");
    //Details
    mp.pack_map(1);
    mp.pack("roles");
    //Roles
    mp.pack_map(1);
    mp.pack("subscriber");
    mp.pack_map(0);
    mp.print();

    LOG("mylog" << 2);
}