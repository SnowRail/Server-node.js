if(WIN32)
    message("win 32/64 build!")
elseif(UNIX)
    message("linux build!")
endif()

# CMake 프로그램의 최소 버전
cmake_minimum_required(VERSION 3.11)

# 프로젝트 정보
project(server
  VERSION 1.0
  DESCRIPTION "server"
  LANGUAGES CXX)

# C++ 표준 설정
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

SET ( CMAKE_VERBOSE_MAKEFILE true ) 

# Add the executable target
add_executable(${CMAKE_PROJECT_NAME} server.cpp)

# Compile options - Wall(Show all warnings), Werror(Warning as error
target_compile_options(${CMAKE_PROJECT_NAME} PUBLIC -g -Wall -Werror)

# Link with WinSock library
if(WIN32)
  target_link_libraries(${CMAKE_PROJECT_NAME} PRIVATE wsock32 ws2_32 -static-libstdc++ -static-libgcc)
endif()