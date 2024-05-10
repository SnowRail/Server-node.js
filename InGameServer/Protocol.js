const Protocol = {
    Login : 1,                  // 로그인
    Logout : 2,                 // 로그아웃
    Signin : 3,                 // 회원가입

    StartMatchMaking : 10,      // 매치메이킹 시작
    EnterWaitingRoom : 11,      // 대기실 입장
    LoadGameScene : 12,         // 인게임 씬으로 전환  - 멍청 레이싱에서는 playerconnect로 사용
    PlayerReady : 13,           // 로딩 완료
    GameStartCountDown : 14,         // 게임 시작 / 끝 카운트 다운
    GameStart : 15,             // 게임 시작

    Key : 20,                   // 키 입력
    Item : 21,                  // 아이템 사용
    PlayerReconnect : 22,       // 플레이어 재접속
    PlayerDisconnect : 23,      // 플레이어 접속 끊김
    PlayerGoal : 24,            // 플레이어 골인
    GameEndCountDown : 25,      // 게임 종료 카운트 다운
    GameEnd : 26,               // 게임 종료
    GameSync : 27,              // position update
    Break : 28,                 // 브레이크 입력 
    Sync : 30,                  // 동기화

    ResetServer : 100,          // 서버 리셋

    // PlayerMove : 30, // direction update
    // PlayerBreak : 31,
    // OtherPlayerConnect : 34, // 타 플레이어 입장
    // OtherPlayerReconnect : 35,
    // // 로딩 완료 관련된 프로토콜이 추가되면 좋을 것 같음
    // GameStartCountDown : 51, // 게임 시작 전 카운트 다운
    // GameEndCountDown : 54, // 1등 도착 후 카운트 다운 시작
};

module.exports = Protocol;