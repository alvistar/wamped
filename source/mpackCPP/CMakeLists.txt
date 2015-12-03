include_directories(../../mpack/src)

add_library(mpackcpp MpackPrinter.cpp MsgPackCPP.cpp MsgUnpack.cpp)
target_link_libraries(mpackcpp mpack)