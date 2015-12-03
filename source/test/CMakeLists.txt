include_directories(.. ../mpackCPP)

add_executable(msgpack_test mpacktest.cpp)
add_executable(transport_test WSTransportTest.cpp ../WampTransportWS.cpp)
add_executable(register_test registerProcedureTest.cpp)
target_link_libraries(msgpack_test mpack mpackcpp)
target_link_libraries(register_test mpack mpackcpp)