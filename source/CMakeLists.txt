set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

add_subdirectory(mpackCPP)

LIST(APPEND SOURCES
        Wamp.cpp
        WampTransportWS.cpp
        WampTransportRaw.cpp
        SocketTypes.cpp)
LIST(APPEND LIBRARIES wamped)

if(YOTTA_CFG_MBED)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-literal-suffix")
    LIST(APPEND SOURCES SocketMBED.cpp)
    LIST(APPEND LIBRARIES mbed-drivers sockets)
    add_executable(wampDemo WampMBEDMain.cpp Accelerometer/FXOS8700Q.cpp)
else(YOTTA_CFG_MBED) #Not MBED
    include_directories(../mpack)
    LIST(APPEND SOURCES SocketPosix.cpp)
    add_executable(wampDemo AppDesktop.cpp)
endif(YOTTA_CFG_MBED)

add_library(wamped ${SOURCES})
target_link_libraries(wamped mpackcpp)
target_link_libraries(wampDemo ${LIBRARIES})

if(YOTTA_CFG_MBED)
    yotta_postprocess_target(EXECUTABLE wampDemo)
endif(YOTTA_CFG_MBED)

add_subdirectory(test)
