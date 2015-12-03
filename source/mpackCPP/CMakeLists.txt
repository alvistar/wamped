include_directories(../../mpack/src)

add_library(mpackcpp MsgPack.cpp MsgUnpack.cpp)
target_link_libraries(mpackcpp mpack)