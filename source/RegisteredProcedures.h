//
// Created by Alessandro Viganò on 21/04/15.
//
#include <exception>
#include <string>
#include "MsgUnpack.h"
#include "MsgPackCPP.h"
#include <functional>
#include <iostream>
//#include "alvistar/lserializer/WSArray.h"

#ifndef CPPWAMP_REGISTEREDPROCEDURES_H
#define CPPWAMP_REGISTEREDPROCEDURES_H


class WampException: public std::exception {
private:
    std::string msg;
public:
    WampException(std::string msg):msg(msg) {};
    virtual const char *what() const throw() override {
        return msg.c_str();
    }
};

//---------------------------------------
//Helper functions
//---------------------------------------

template <std::size_t... Indices>
struct indices {
    using next = indices<Indices..., sizeof...(Indices)>;
};

template <std::size_t N>
struct build_indices {
    using type = typename build_indices<N-1>::type::next;
};
template <>
struct build_indices<0> {
    using type = indices<>;
};
template <std::size_t N>
using BuildIndices = typename build_indices<N>::type;

template <typename ...ARGS>
void checkParameters (ARGS...) {

}

template <typename ret, typename ...ARGS>
class unpack_caller
{
private:
    template <size_t... I>
    int _check (MPNode& arr, indices<I...>) {
        checkParameters<ARGS...>(arr.at(I)...);
        return arr.getError();
    }

    template <typename FuncType, size_t... I>
    auto call(FuncType &f, MPNode& arr, indices<I...>) -> ret
    {

        auto res = f(arr.at(I)...);
        return res;
    }

public:

    template <typename FuncType>
    auto operator () (FuncType &f, MPNode& arr)
    -> ret
    {
        return call(f, arr, BuildIndices<sizeof... (ARGS)>{});
    }

    int check(MPNode& arr) {
        return _check(arr, BuildIndices<sizeof... (ARGS)>{});
    }
};



//Specialization for void
//TODO
//template <typename ...ARGS>
//class unpack_caller<void, ARGS>
//{
//private:
//    template <typename FuncType, size_t... I>
//    void call(FuncType &f, MPNode arr, indices<I...>)
//    {
//        f(arr.at(I)...);
//    }
//
//public:
//    template <typename FuncType>
//    void operator () (FuncType &f, MPNode arr)
//    {
//        //TODO
////        if (arr.size() != num_args) {
////            throw (WampException("Wrong Number of Parameters"));
////        }
//        call(f, arr, BuildIndices<num_args>{});
//    }
//};


//--------------------
//RegisteredProcedures
//--------------------

class RegisteredProcedureBase {
public:
    virtual MsgPack invoke(MPNode arr)= 0;
    virtual int check (MPNode arr) = 0;
};

template <typename R, typename ...ARGS>
class RegisteredProcedure: public RegisteredProcedureBase {
    using FUNC = std::function<R(ARGS...)>;
private:
    FUNC f;
public:
    RegisteredProcedure(FUNC f):f(f) {};

    virtual int check (MPNode arr) override {
        if (sizeof ... (ARGS) != arr.arrayLength()) {
            //Wrong number of arguments
            return false;
        }

        if ( unpack_caller<void, ARGS...>().check(arr)) {
            //Wrong type of arguments
            //std::cout << "Wrong type of arguments " << std::endl;
            return false;
        }
        return true;
    }

    virtual MsgPack invoke(MPNode arr) override {
        return (MsgPack) unpack_caller<R, ARGS...>{} (f,arr);
    }


};

//Specialization for void
template <typename ...ARGS>
class RegisteredProcedure<void, ARGS...>: public RegisteredProcedureBase {
    using FUNC = std::function<void(ARGS...)>;
private:
    FUNC f;
public:
    RegisteredProcedure(FUNC f):f(f) {};

    virtual int check (MPNode arr) override {
        if (sizeof ... (ARGS) != arr.arrayLength()) {
            //Wrong number of arguments
            return false;
        }

        if ( unpack_caller<void, ARGS...>().check(arr)) {
            //Wrong type of arguments
            //std::cout << "Wrong type of arguments " << std::endl;
            return false;
        }

        return true;
    }

    virtual MsgPack invoke(MPNode arr) override {

        unpack_caller<void, ARGS...>{} ();
        return MsgPack();
    }
};

template <typename R, typename ...ARGS>
RegisteredProcedureBase* make_RegisteredProcedure(R (*fffp)(ARGS ...))
{
    return new RegisteredProcedure<R, ARGS...> (fffp);
}

#endif //CPPWAMP_REGISTEREDPROCEDURES_H
