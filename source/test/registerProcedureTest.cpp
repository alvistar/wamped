#include "RegisteredProcedures.h"
#include "MsgPackCPP.h"
#include <iostream>
#include <string>

int add(int x, int y) {
    std::cout << "Called with "<< x << ":"<<y<< std::endl;
    return x+y;
}

std::string mixed(int x, int y) {
    //std::cout << node.toJson() << std::endl;
    return 0;
};

MsgPack empty(int x, int y) {
    std::cout << "Called with "<< x << ":"<<y<< std::endl;
    return MsgPackArr {3,5};
}

int main() {
    auto p = make_RegisteredProcedure(empty);


    MsgPackArr mp{2,3};
    MsgUnpack munp (mp.getData(), mp.getUsedBuffer());
    MPNode root = munp.getRoot();

    p->invoke(root).print();

}