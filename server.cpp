#include <WinSock2.h>
#include <Ws2tcpip.h>
#include <iostream>
#define SERVERPORT 30303
using namespace std;
// #pragma comment(lib, "ws2_32.lib")

int main() {
    cout << "Server on " << SERVERPORT << endl;
    // Winsock �ʱ�ȭ
    WSADATA wsaData;
    int iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        cerr << "WSAStartup failed: " << iResult << endl;
        return 1;
    }

    // UDP ���� ����
    SOCKET serverSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (serverSocket == INVALID_SOCKET) {
        cerr << "Socket failed: " << WSAGetLastError() << endl;
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
        cerr << "Bind failed: " << WSAGetLastError() << endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    cout << "UDP Server Running..." << endl;
    while (true) {
        // Ŭ���̾�Ʈ�κ��� �޽��� ����
        char buffer[1024];
        sockaddr_in clientAddr;
        int clientAddrLen = sizeof(clientAddr);
        int bytesReceived = recvfrom(serverSocket, buffer, sizeof(buffer), 0, (sockaddr*)&clientAddr, &clientAddrLen);
        if (bytesReceived == SOCKET_ERROR) {
            cerr << "Receive failed: " << WSAGetLastError() << endl;
            closesocket(serverSocket);
            WSACleanup();
            return 1;
        }

        cout << "Received " << bytesReceived << " bytes from "
              << inet_ntoa(clientAddr.sin_addr) << ":" << ntohs(clientAddr.sin_port)
              << endl;

        // ���ŵ� ������ ���
        cout << "Data: " << std::string(buffer, bytesReceived) << endl;

        // Ŭ���̾�Ʈ���� ������ ���� (����)
        int bytesSent = sendto(
        serverSocket, buffer, bytesReceived, 0, (sockaddr*)&clientAddr, clientAddrLen);
        if (bytesSent == SOCKET_ERROR) {
            cerr << "Sendto failed: " << WSAGetLastError() << endl;
            continue;
        }
    }

    // ���� ���� �ݱ�
    closesocket(serverSocket);
    // Winsock ����
    WSACleanup();

    return 0;
}
