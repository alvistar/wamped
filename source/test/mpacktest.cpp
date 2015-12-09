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

#include "mpack/mpack.h"
#include "mpackCPP/MsgPack.h"
#include "mpackCPP/MsgUnpack.h"
#include "wamped/logger.h"
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