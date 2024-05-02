const net = require('net');
const { ByteReader, ByteWriter } = require('../Network');
const Protocol = require('./Protocol');
const NetworkObjectManager = require('./NetworkObjectManager');
const UnityInstance = require('./UnityClass/UnityInstance');
const { intSize, floatSize } = require('./typeSize');
const SocketManager = require('./SoketManager');

const {
    FirstConn,
    UpdatePlayerPos,
    PlayerBreak,
    UpdatePlayerDirection,
    PlayerDisconnect,
    PlayerGoal,
    CountDown,
    ResetServer,
    SendKeyValue,
} = require('./ProtocolHandler');
const { send } = require('process');

const idList = [];
let dataCount = 0;

const server = net.createServer((socket) =>
{
    socket.name = socket.remoteAddress + ":" + socket.remotePort;
    let num = 0;
    do {
        num = Math.floor(Math.random() * (100 - 0 + 1)) + 0;
    } while(idList.includes(num));
    idList.push(num);
    socket.clientID = num;
    socket.syncCount = 0;
    
    SocketManager.addSocket(socket);
    
    console.log('새로운 클라이언트 접속 : ', socket.name);
    console.log('클라이언트 ID : ' + socket.clientID);

    FirstConn(socket, num);

    let recvData = '';
    socket.on('data',(data)=> 
    {
        recvData += data.toString();

        if(recvData.includes('\n')){
            const msg = recvData.split('\n');
            const lastMsg = msg[msg.length - 2];
            const jsonData = JSON.parse(lastMsg);
            const protocol = jsonData.type;

            //console.log('recv protocol : ', protocol);

            switch(protocol){
                case Protocol.Key:
                    sendKeyValue(jsonData);
                    break;
                case Protocol.GameStart:
                    GameStartCountDown(protocol);
                    break;

                case Protocol.GameSync:
                    const syncId = jsonData.id;
                    const playerPos = jsonData.position;
                    const playerRot = jsonData.rotation;
                    UpdatePlayerPos(socket, syncId, playerPos, playerRot);
                    break;
                case Protocol.GameStart:
                    //GameStartCountDown(protocol);
                    CountDown(protocol);
                    break;
                case Protocol.PlayerBreak:
                    const breakId = jsonData.from;
                    PlayerBreak(socket, breakId);
                    break;
                
                case Protocol.PlayerGoal:
                    const goalId = jsonData.id;
                    PlayerGoal(goalId);
                    break;
                case Protocol.GameEndCountDown:
                    break;
                case Protocol.ResetServer:
                    ResetServer()
                    break;
                default:
                    console.log('알 수 없는 프로토콜 : ', protocol);
                    break;
            }
            recvData = '';
            dataCount++;
        }
    });

    socket.on('end',() =>
    {
        console.log('클라이언트 접속 종료 : ', socket.remoteAddress,socket.remotePort);
        SocketManager.removeSocket(socket);
        PlayerDisconnect(socket,socket.clientID);
    });

    socket.on('error',(err)=>
    {
        console.error('소켓 에러 : ', err);
        PlayerDisconnect(socket,socket.clientID);
        SocketManager.removeSocket(socket);
    });
});



server.listen(30303,() => 
{
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.')
});