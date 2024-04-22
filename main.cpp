#include <WinSock2.h>
#include <Ws2tcpip.h>
#include <iostream>
#define SERVERPORT 5001

// #pragma comment(lib, "ws2_32.lib")

int main() {
    std::cout << "Server started on " << SERVERPORT << std::endl;
    // Winsock 초기화
    WSADATA wsaData;
    int iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        std::cerr << "WSAStartup failed: " << iResult << std::endl;
        return 1;
    }

    // 서버 소켓 생성
    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "socket failed: " << WSAGetLastError() << std::endl;
        WSACleanup();
        return 1;
    }

    // 서버 소켓 주소 정보 설정
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(SERVERPORT);

    // 서버 소켓 바인딩
    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "bind failed: " << WSAGetLastError() << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    // 서버 소켓 수신 대기 상태 설정
    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "listen failed: " << WSAGetLastError() << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    while (true) {
        // 클라이언트 연결 수락
        sockaddr_in clientAddr;
        int clientAddrLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrLen);
        if (clientSocket == INVALID_SOCKET) {
            std::cerr << "accept failed: " << WSAGetLastError() << std::endl;
            continue;
        }

        // 클라이언트 정보 출력
        char clientAddrStr[INET_ADDRSTRLEN];
        // inet_ntop(AF_INET, (void*)&clientAddr.sin_addr, clientAddrStr, INET_ADDRSTRLEN);
        std::cout << "Client connected: " << clientAddrStr << ":" << ntohs(clientAddr.sin_port) << std::endl;

        // 클라이언트에게 메시지 전송
        const char* message = "Hello, World!\n";
        int bytesSent = send(clientSocket, message, strlen(message), 0);
        if (bytesSent == SOCKET_ERROR) {
            std::cerr << "send failed: " << WSAGetLastError() << std::endl;
            closesocket(clientSocket);
            continue;
        }

        // 연결 닫기
        closesocket(clientSocket);
    }

    // Winsock 종료
    WSACleanup();

    return 0;
}
