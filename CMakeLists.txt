if(YOTTA_CFG_MBED)

else(YOTTA_CFG_MBED)
    cmake_minimum_required(VERSION 3.3)
    project(wamp_mbed)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
    

endif(YOTTA_CFG_MBED)

add_subdirectory(mpack)
add_subdirectory(source)

