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
    UpdatePlayerDirection,
    PlayerDisconnect,
    PlayerGoal,
    GameStartCountDown,
    ResetServer,
} = require('./ProtocolHandler');

const idList = [];

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

    FirstConn(socket,num);
    
    socket.on('data',(data)=> 
    {
        const offset = 4;
        const jsonstring = data.substring(offset);
        const jsonData = JSON.parse(jsonstring.toString());
        const protocol = jsonData.protocol;
        
        console.log('protocol : ', protocol);

        switch(protocol){
            case Protocol.PlayerMove:
                const moveId = jsonData.id;
                const playerDirection = jsonData.direction;
                UpdatePlayerDirection(socket, moveId, playerDirection);
                break;
            case Protocol.SyncPosition:
                const syncId = jsonData.id;
                const playerPos = jsonData.position;
                const playerRot = jsonData.rotation;
                UpdatePlayerPos(socket, syncId, playerPos, playerRot);
                break;
            case Protocol.GameStart:
                GameStartCountDown(protocol);
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
        }

        // const byteReader = new ByteReader(data);
        // const protocol = byteReader.readByte();
        
        // switch(protocol){
        //     case Protocol.PlayerMove:
        //         const moveId = byteReader.readInt();
        //         const playerDirection = byteReader.readVector3();
        //         UpdatePlayerDirection(socket, moveId, playerDirection);
        //         break;
        //     case Protocol.SyncPosition:
        //         const syncId = byteReader.readInt();
        //         const playerPos = byteReader.readVector3();
        //         const playerRot = byteReader.readVector3();
        //         UpdatePlayerPos(socket, syncId, playerPos, playerRot);
        //         break;
        //     case Protocol.GameStart:
        //         GameStartCountDown(protocol);
        //         break;
        //     case Protocol.PlayerGoal:
        //         const goalId = byteReader.readInt();   
        //         PlayerGoal(socket, goalId);
        //         break;
        //     case Protocol.GameEndCountDown:
        //         break;
        //     case Protocol.ResetServer:
        //         ResetServer()
        //         break;
        // }
    });

    socket.on('end',() =>
    {
        console.log('클라이언트 접속 종료 : ', socket.remoteAddress,socket.remotePort);
        PlayerDisconnect(socket,socket.clientID);
        SocketManager.removeSocket(socket);
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
