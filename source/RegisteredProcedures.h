//
// Created by Alessandro Viganò on 21/04/15.
//
#include <exception>
#include <string>
#include "MsgUnpack.h"
#include "MsgPackCPP.h"
#include <functional>
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

template <typename ret, size_t num_args>
class unpack_caller
{
private:
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

        //TODO

//        if (arr.size() != num_args) {
//                throw (WampException("Wrong Number of Parameters"));
//        }

        return call(f, arr, BuildIndices<num_args>{});
    }
};

//Specialization for void
template <size_t num_args>
class unpack_caller<void, num_args>
{
private:
    template <typename FuncType, size_t... I>
    void call(FuncType &f, MPNode arr, indices<I...>)
    {
        f(arr.at(I)...);
    }

public:
    template <typename FuncType>
    void operator () (FuncType &f, MPNode arr)
    {
        //TODO
//        if (arr.size() != num_args) {
//            throw (WampException("Wrong Number of Parameters"));
//        }
        call(f, arr, BuildIndices<num_args>{});
    }
};


//--------------------
//RegisteredProcedures
//--------------------

class RegisteredProcedureBase {
public:
    virtual MsgPack invoke(MPNode arr)= 0;
};

template <typename R, typename ...ARGS>
class RegisteredProcedure: public RegisteredProcedureBase {
    using FUNC = std::function<R(ARGS...)>;
private:
    FUNC f;
public:
    RegisteredProcedure(FUNC f):f(f) {};
    virtual MsgPack invoke(MPNode arr) override {
        MsgPack ret;

        ret = unpack_caller<R, sizeof...(ARGS)>()(f, arr);
        //TODO
//        catch (WSException& e) {
//            LOG(ERROR) << e.what();
//            throw(WampException("Wrong type of parameters"));
//        }
        return ret;
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
    virtual MsgPack invoke(MPNode arr) override {
        //MPNode ret;
        unpack_caller<void, sizeof...(ARGS)>()(f, arr);

        //TODO
//        catch (WSException) {
//            throw(WampException("Wrong type of parameters"));
//        }

        return MsgPack();
    }
};

template <typename R, typename ...ARGS>
RegisteredProcedureBase* make_RegisteredProcedure(R (*fffp)(ARGS ...))
{
    return new RegisteredProcedure<R, ARGS...> (fffp);
}

#endif //CPPWAMP_REGISTEREDPROCEDURES_H
