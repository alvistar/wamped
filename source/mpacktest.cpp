#include "mpack/mpack.h"
#include "MsgPackCPP.h"
#include "MsgUnpack.h"
#include "logger.h"
#include <iostream>

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

    MsgPack mp2;
    mp2 << MPARR(3) << 1 << "realm1" << MPMAP(1)
            << "roles" << MPMAP(1) << "subscriber" << MPMAP(0);

    mp2.print();

    MsgPackArr mp3 {"gatto","cane","pesce"};
    mp3.print();

    MsgPackMap mp4 {"colore","rosso","pesce","spigola"};
    mp4.print();

    MsgUnpack munp(mp3.getData(),mp3.getUsedBuffer());
    MPNode root = munp.getRoot();


    std::cout << root.toJson() << ":" << (std::string) root[1];


}