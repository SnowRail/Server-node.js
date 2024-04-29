const Protocol = {
    s_NewUser : 29,
    PlayerMove : 30,
    s_PlayerConnect : 31,
    c_PlayerReconnect : 32,
    
    LoadGameScene : 50, // 게임 씬으로 전환
    GameStartCountDown : 51, // 게임 시작 전 카운트 다운
    GameStart : 52, // 게임 시작
    GameEndCountDown : 53, // 1등 도착 후 카운트 다운 시작
    GameEnd : 54, // 게임 종료
};

module.exports = Protocol;