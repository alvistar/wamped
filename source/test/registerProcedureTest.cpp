#include "RegisteredProcedures.h"
#include "MsgPackCPP.h"
#include <iostream>

int add(int x, int y) {
    std::cout << "Called with "<< x << ":"<<y<< std::endl;
    return x+y;
}

int main() {
    auto p = make_RegisteredProcedure(add);

    MsgPackArr mp{4,5};
    MsgUnpack munp (mp.getData(), mp.getUsedBuffer());
    MPNode root = munp.getRoot();

    p->invoke(root).print();

}