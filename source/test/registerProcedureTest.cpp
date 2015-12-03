#include "RegisteredProcedures.h"
#include "MsgPack.h"
#include <iostream>
#include <string>

int add(int x, int y) {
    std::cout << "Called with "<< x << ":"<<y<< std::endl;
    return x+y;
}

std::string mixed(int x, int y) {
    std::cout << "Called with "<< x << ":"<<y<< std::endl;
    return 0;
};

void empty(int x, int y) {
    std::cout << "Called with "<< x << ":"<<y<< std::endl;
}

uint16_t voidargs() {
    return 777;
}

int main() {
    auto p1 = make_RegisteredProcedure(empty);
    auto p2 = make_RegisteredProcedure(voidargs);


    MsgPackArr mp2{3,4};
    MsgUnpack munp2 (mp2.getData(), mp2.getUsedBuffer());
    MPNode root2= munp2.getRoot();
    if (p1->check(root2))
        std::cout << p1->invoke(root2) << std::endl;


    MsgPackArr mp{};
    MsgUnpack munp (mp.getData(), mp.getUsedBuffer());
    MPNode root = munp.getRoot();
    if (p2->check(root))
        std::cout << p2->invoke(root) << std::endl;

}