#include "mpack/mpack.h"
#include "MsgPack.h"
#include "MsgUnpack.h"
#include "logger.h"
#include <iostream>

using namespace std;
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
    std::cout  << mp << endl;

    LOG("mylog" << 2);


    MsgPackArr mp3 {"gatto","cane","pesce"};
    std::cout << mp3 << endl;

    MsgPackMap mp4 {"colore","rosso","pesce","spigola"};
    std::cout << mp4 << endl;

    MsgUnpack munp(mp3.getData(),mp3.getUsedBuffer());
    MPNode root = munp.getRoot();

    MsgPack mp5;
    mp5.packArray(7,8,"gatto");
    std::cout << mp5 << endl;


    std::cout << root.getJson() << ":" << (std::string) root[1];


}