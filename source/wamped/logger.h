#include <iostream>

#ifndef LOGGER_H
#define LOGGER_H
struct None { };

template <typename First,typename Second>
struct Pair {
    First first;
    Second second;
};

template <typename List>
struct LogData {
    List list;
};

template <typename Begin,typename Value>
LogData<Pair<Begin,const Value &>>
operator<<(LogData<Begin> begin,const Value &value)
{
    return {{begin.list,value}};
}

template <typename Begin,size_t n>
LogData<Pair<Begin,const char *>>
operator<<(LogData<Begin> begin,const char (&value)[n])
{
    return {{begin.list,value}};
}

inline void printList(std::ostream &os,None)
{
	(void) os;
}


template <typename Begin,typename Last>
void printList(std::ostream &os,const Pair<Begin,Last> &data)
{
    printList(os,data.first);
    os << data.second;
}

template <typename List>
void log(const char *file,int line,const LogData<List> &data)
{
    std::cout << file << " (" << line << "): ";
    printList(std::cout,data.list);
#ifndef YOTTA_CFG_MBED
    std::cout << "\n";
#else //YOTTA_CFG_MBED
    std::cout << "\r\n";
#endif //YOTTA_CFG_MBED
}
#endif //LOGGER_H

#ifdef LOG
#undef LOG
#endif

#define LOG(x) (log(__FILE__,__LINE__,LogData<None>() << x))

