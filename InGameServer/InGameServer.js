const process = require('process');
const net = require('net');
const Protocol = require('./Protocol');
const SocketManager = require('./SoketManager');

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const serverIP = process.env.SERVER_IP;
const serverPORT = process.env.SERVER_PORT;
const io2 = require('socket.io-client');
const interServerSocket = io2('http://'+serverIP+':'+serverPORT);
const logger = require('./logger');

const {
    //  ----websocket----
    AddGameRoomList,
    //  -------tcp--------
    SetPlayerInfo,
    FirstConn,
    UpdatePlayerPos,
    PlayerBreak,
    PlayerDisconnect,
    PlayerGoal,
    CountDown,
    ResetServer,
    SendKeyValue,
} = require('./ProtocolHandler');

const idList = [];

const server = net.createServer((socket) =>
{

    logger.info(`새로운 클라이언트 접속`);
    // FirstConn(socket, num);

    let recvData = '';
    socket.on('data',(data)=> 
    {
        recvData += data.toString();

        if(recvData.includes('\n'))
        {
            const msg = recvData.split('\n');
            for(let i = 0; i < msg.length-1; ++i)
            {
                let jsonData;
                try{
                    jsonData = JSON.parse(msg[i]);
                }
                catch(e){
                    logger.error('Json 파싱 에러 :', e);
                    return;
                }

                const protocol = jsonData.type;
                
                switch(protocol){
                    case Protocol.Login:
                        SetPlayerInfo(socket,jsonData);
                        break;
                    case Protocol.Logout:
                        // todo logout
                        break;
                    case Protocol.Signin:
                        // todo SignIn
                        break;
                    case Protocol.StartMatchMaking:
                        // TODO StartMatchMaking
                        break;
                    case Protocol.GameStart:
                        //GameStartCountDown(protocol);t
                        CountDown(protocol, jsonData.roomID);
                        break;
                    case Protocol.PlayerReady:
                        // TODO PlayerReady
                        break;
                    
                    case Protocol.Key:
                        SendKeyValue(socket, jsonData);
                        break;
                    case Protocol.PlayerGoal:
                        PlayerGoal(jsonData.from,jsonData.roomID);
                        break;
                    case Protocol.Break:
                        PlayerBreak(socket, jsonData);
                        break;
                    case Protocol.Sync:
                        UpdatePlayerPos(socket, jsonData);
                        break;
                    case Protocol.ResetServer:
                        ResetServer()
                        break;
                    default:
                        logger.warn('알 수 없는 프로토콜 :', protocol);
                        break;
                }
            }
            recvData = '';
            recvData += msg[msg.length-1];
        }
    });

    socket.on('end',() =>
    {
        logger.info(`클라이언트 접속 종료`);
        SocketManager.removeSocket(socket);
        PlayerDisconnect(socket,socket.clientID);
    });

    socket.on('error',(err)=>
    {
        logger.error('소켓 에러 : ', err);
        PlayerDisconnect(socket,socket.clientID);
        SocketManager.removeSocket(socket);
    });
});

server.listen(30303,() => 
{
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.');
}).on('error',(err)=>{
    logger.error('서버 에러 : ', err);
    process.exit(1);
});


// outgameserver 연결 
//
interServerSocket.on('connect', () => {
    console.log('서버에 접속했습니다.');
    interServerSocket.emit('message', '안녕하세요, 서버!');

    interServerSocket.on('message', (data) => {
        console.log('서버로부터 받은 메시지:', data);
    });

    interServerSocket.on('enterInGame', (data) => {
        console.log('enterInGame 받은 메시지:', data);
        AddGameRoomList(data);
    });
    
    interServerSocket.on('disconnect', () => {
        console.log('서버 접속이 해제되었습니다.');
    });
});

  
