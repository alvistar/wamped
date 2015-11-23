add_executable(wamp WampMBEDMain.cpp MsgPackCPP.cpp WampMBED.cpp WampTransportRaw.cpp MsgUnpack.cpp)

target_link_libraries(wamp msgpack)
