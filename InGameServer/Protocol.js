const Protocol = {
    PlayerMove : 30, // direction update
    PlayerReconnect : 31,
    PlayerDisconnect : 32,
    OtherPlayerConnect : 33, // 타 플레이어 입장
    OtherPlayerReconnect : 34,
    SyncPosition : 35, // position update

    LoadGameScene : 50, // 게임 씬으로 전환  - 멍청 레이싱에서는 playerconnect로 사용
    GameStartCountDown : 51, // 게임 시작 전 카운트 다운
    GameStart : 52, // 게임 시작
    GameEndCountDown : 53, // 1등 도착 후 카운트 다운 시작
    GameEnd : 54, // 게임 종료
};

module.exports = Protocol;