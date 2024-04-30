const Protocol = {
    PlayerMove : 30, // direction update
    PlayerReconnect : 31,
    PlayerDisconnect : 32,
    OtherPlayerConnect : 33, // 타 플레이어 입장
    OtherPlayerReconnect : 34,
    SyncPosition : 35, // position update


    LoadGameScene : 50, // 게임 씬으로 전환  - 멍청 레이싱에서는 playerconnect로 사용
    // 로딩 완료 관련된 프로토콜이 추가되면 좋을 것 같음
    GameStartCountDown : 51, // 게임 시작 전 카운트 다운
    GameStart : 52, // 게임 시작
    PlayerGoal : 53, // 플레이어 골인
    GameEndCountDown : 54, // 1등 도착 후 카운트 다운 시작
    GameEnd : 55, // 게임 종료

    ResetServer : 100,
};

module.exports = Protocol;