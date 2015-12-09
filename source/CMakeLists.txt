set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

if(YOTTA_CFG_MBED)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-literal-suffix")
else(YOTTA_CFG_MBED)
include_directories(../mpack)
endif(YOTTA_CFG_MBED)

add_subdirectory(mpackCPP)
add_subdirectory(wamped)
add_subdirectory(test)