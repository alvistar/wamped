cmake_minimum_required(VERSION 3.3)
project(wamp_mbed)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

add_subdirectory(source)
add_subdirectory(mpack)