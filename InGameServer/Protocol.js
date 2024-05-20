const Protocol = {
    GameSetUp : 1,         // 인게임 씬으로 전환  - 멍청 레이싱에서는 playerconnect로 사용
    PlayerReady : 2,           // 로딩 완료
    GameStartCountDown : 3,         // 게임 시작 / 끝 카운트 다운
    GameStart : 4,             // 게임 시작
    PlayerDisconnect : 5,
    PlayerGoal : 6,            // 플레이어 골인
    GameEndCountDown : 7,      // 게임 종료 카운트 다운
    GameEnd : 8,               // 게임 종료
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