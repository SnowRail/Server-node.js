#include <WinSock2.h>
#include <Ws2tcpip.h>
#include <iostream>
#define SERVERPORT 5001

// #pragma comment(lib, "ws2_32.lib")

int main() {
    std::cout << "Server started on " << SERVERPORT << std::endl;
    // Winsock �ʱ�ȭ
    WSADATA wsaData;
    int iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        std::cerr << "WSAStartup failed: " << iResult << std::endl;
        return 1;
    }

    // ���� ���� ����
    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "socket failed: " << WSAGetLastError() << std::endl;
        WSACleanup();
        return 1;
    }

    // ���� ���� �ּ� ���� ����
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(SERVERPORT);

    // ���� ���� ���ε�
    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "bind failed: " << WSAGetLastError() << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    // ���� ���� ���� ��� ���� ����
    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "listen failed: " << WSAGetLastError() << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    while (true) {
        // Ŭ���̾�Ʈ ���� ����
        sockaddr_in clientAddr;
        int clientAddrLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrLen);
        if (clientSocket == INVALID_SOCKET) {
            std::cerr << "accept failed: " << WSAGetLastError() << std::endl;
            continue;
        }

        // Ŭ���̾�Ʈ ���� ���
        char clientAddrStr[INET_ADDRSTRLEN];
        // inet_ntop(AF_INET, (void*)&clientAddr.sin_addr, clientAddrStr, INET_ADDRSTRLEN);
        std::cout << "Client connected: " << clientAddrStr << ":" << ntohs(clientAddr.sin_port) << std::endl;

        // Ŭ���̾�Ʈ���� �޽��� ����
        const char* message = "Hello, World!\n";
        int bytesSent = send(clientSocket, message, strlen(message), 0);
        if (bytesSent == SOCKET_ERROR) {
            std::cerr << "send failed: " << WSAGetLastError() << std::endl;
            closesocket(clientSocket);
            continue;
        }

        // ���� �ݱ�
        closesocket(clientSocket);
    }

    // Winsock ����
    WSACleanup();

    return 0;
}
