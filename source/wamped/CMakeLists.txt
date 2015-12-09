include_directories(..)

LIST(APPEND SOURCES
        Wamp.cpp
        WampTransportWS.cpp
        WampTransportRaw.cpp
        SocketTypes.cpp)
LIST(APPEND LIBRARIES wamped)

if(YOTTA_CFG_MBED)
    LIST(APPEND SOURCES SocketMBED.cpp)
    LIST(APPEND LIBRARIES mbed-drivers sockets)
    #add_executable(wampDemo WampMBEDMain.cpp Accelerometer/FXOS8700Q.cpp)
else(YOTTA_CFG_MBED) #Not MBED
    LIST(APPEND SOURCES SocketPosix.cpp)
endif(YOTTA_CFG_MBED)

#wamped library
add_library(wamped ${SOURCES})
target_link_libraries(wamped mpackcpp)

if((DEBUG_WAMPED_WAMP) OR (YOTTA_CFG_WAMPED_DEBUG_WAMP))
    add_definitions(-DDEBUG_WAMP)
    MESSAGE("WAMPED Debug enabled on WAMPED Wamp Layer")
endif()

if((DEBUG_WAMPED_TRANSPORT) OR (YOTTA_CFG_WAMPED_DEBUG_TRANSPORT))
    add_definitions(-DDEBUG_WAMP_TRANSPORT)

    MESSAGE("WAMPED Debug enabled on WAMPED Transport Layer")

endif()


