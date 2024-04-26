#include <WinSock2.h>
#include <Ws2tcpip.h>
#include <iostream>
#define SERVERPORT 30303
using namespace std;
// #pragma comment(lib, "ws2_32.lib")

int main() {
    cout << "Server on " << SERVERPORT << endl;
    // Winsock 초기화
    WSADATA wsaData;
    int iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        cerr << "WSAStartup failed: " << iResult << endl;
        return 1;
    }

    // UDP 소켓 생성
    SOCKET serverSocket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (serverSocket == INVALID_SOCKET) {
        cerr << "Socket failed: " << WSAGetLastError() << endl;
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
        cerr << "Bind failed: " << WSAGetLastError() << endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    cout << "UDP Server Running..." << endl;
    while (true) {
        // 클라이언트로부터 메시지 수신
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

        // 수신된 데이터 출력
        cout << "Data: " << std::string(buffer, bytesReceived) << endl;

        // 클라이언트에게 데이터 전송 (에코)
        int bytesSent = sendto(
        serverSocket, buffer, bytesReceived, 0, (sockaddr*)&clientAddr, clientAddrLen);
        if (bytesSent == SOCKET_ERROR) {
            cerr << "Sendto failed: " << WSAGetLastError() << endl;
            continue;
        }
    }

    // 서버 소켓 닫기
    closesocket(serverSocket);
    // Winsock 종료
    WSACleanup();

    return 0;
}
