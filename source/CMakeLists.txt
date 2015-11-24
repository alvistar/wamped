set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -Wno-literal-suffix")
include_directories(../mpack/src)

LIST(APPEND SOURCES WampMBEDMain.cpp MsgPackCPP.cpp MsgUnpack.cpp MpackPrinter.cpp WampMBED.cpp)
LIST(APPEND LIBRARIES mpack)

if(YOTTA_CFG_MBED)
    LIST(APPEND SOURCES WampTransportRawMBED.cpp)
    LIST(APPEND LIBRARIES mbed-drivers sockets)
else(YOTTA_CFG_MBED)
    LIST(APPEND SOURCES WampTransportRaw.cpp)
    add_executable(msgpack_test mpacktest.cpp MsgPackCPP.cpp)
	target_link_libraries(msgpack_test mpack)
endif(YOTTA_CFG_MBED)

add_executable(wamp WampMBEDMain.cpp ${SOURCES})
target_link_libraries(wamp ${LIBRARIES})


