set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -Wno-literal-suffix")
include_directories(../mpack/src)

LIST(APPEND SOURCES MsgPackCPP.cpp MsgUnpack.cpp MpackPrinter.cpp
        WampMBED.cpp WampTransportRaw.cpp SocketTypes.cpp)
LIST(APPEND LIBRARIES mpack)

if(YOTTA_CFG_MBED)
    LIST(APPEND SOURCES SocketMBED.cpp)
    LIST(APPEND LIBRARIES mbed-drivers sockets)
    add_executable(wamp WampMBEDMain.cpp ${SOURCES})

else(YOTTA_CFG_MBED) #Not MBED
    LIST(APPEND SOURCES WampTransportWS.cpp SocketOSX.cpp)
    add_executable(msgpack_test mpacktest.cpp MsgPackCPP.cpp MsgUnpack.cpp MpackPrinter.cpp)
    add_executable(transport_test WSTransportTest.cpp WampTransportWS.cpp)
    target_link_libraries(msgpack_test mpack)

    add_executable(wamp AppDesktop.cpp ${SOURCES})
endif(YOTTA_CFG_MBED)

target_link_libraries(wamp ${LIBRARIES})


if(YOTTA_CFG_MBED)
    yotta_postprocess_target(EXECUTABLE wamp)
endif(YOTTA_CFG_MBED)
