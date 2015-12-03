set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

add_subdirectory(mpackCPP)
include_directories(../mpack/src mpackCPP)

LIST(APPEND SOURCES
        Wamp.cpp
        WampTransportWS.cpp
        WampTransportRaw.cpp
        SocketTypes.cpp)
LIST(APPEND LIBRARIES mpackcpp)

if(YOTTA_CFG_MBED)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-literal-suffix")
    LIST(APPEND SOURCES SocketMBED.cpp Accelerometer/FXOS8700Q.cpp)
    LIST(APPEND LIBRARIES mbed-drivers sockets)
    add_executable(wamp WampMBEDMain.cpp ${SOURCES})

else(YOTTA_CFG_MBED) #Not MBED
    LIST(APPEND SOURCES SocketOSX.cpp)
    add_executable(wamp AppDesktop.cpp ${SOURCES})
    add_subdirectory(test)
endif(YOTTA_CFG_MBED)

target_link_libraries(wamp ${LIBRARIES})


if(YOTTA_CFG_MBED)
    yotta_postprocess_target(EXECUTABLE wamp)
endif(YOTTA_CFG_MBED)
