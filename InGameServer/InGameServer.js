const net = require('net');
const Protocol = require('./Protocol');
const SocketManager = require('./SoketManager');
const process = require('process');
const logger = require('./logger');

const {
    FirstConn,
    UpdatePlayerPos,
    PlayerBreak,
    PlayerDisconnect,
    PlayerGoal,
    CountDown,
    ResetServer,
    SendKeyValue,
    Respawn,
} = require('./ProtocolHandler');
const { log } = require('console');

const idList = [];

const server = net.createServer((socket) =>
{
    let num = 0;
    do {
        num = Math.floor(Math.random() * (100 - 0 + 1)) + 0;
    } while(idList.includes(num));
    idList.push(num);
    socket.clientID = num;
    socket.syncCount = 0;
    SocketManager.addSocket(socket);

    logger.info(`새로운 클라이언트 접속`);
    logger.info('클라이언트 ID : ' + socket.clientID);

    FirstConn(socket, num);

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
                        // todo login
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
                        CountDown(protocol);
                        break;
                    case Protocol.PlayerReady:
                        // TODO PlayerReady
                        break;
                    
                    case Protocol.Key:
                        SendKeyValue(socket, jsonData);
                        break;
                    case Protocol.PlayerGoal:
                        PlayerGoal(jsonData.from);
                        break;
                    case Protocol.Break:
                        PlayerBreak(socket, jsonData);
                        break;
                    case Protocol.Sync:
                        UpdatePlayerPos(socket, jsonData);
                        break;
                    case Protocol.Respawn:
                        Respawn(socket, jsonData);
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



const outgameServer = net.createServer((socket) => {
    socket.write('반갑습니다');

    socket.on('data', (data) => {
        const msg = data.toString();
        console.log('outgameServer : ', msg);
    });

    socket.on('end',() =>
    {
        logger.info(`outgame 접속 종료`);
    });

    socket.on('error',(err)=>
    {
        logger.error('outgame 에러 : ', err);
    });
});

outgameServer.listen(30304, () => {
    console.log('TCP 서버가 30304번 포트에서 실행 중입니다.');
}).on('error', (err) => {
    logger.error('outgameServer 에러 : ', err);
    process.exit(1);
});