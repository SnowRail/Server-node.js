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
    PlayerDisconnect
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
        const byteReader = new ByteReader(data);
        const protocol = byteReader.readByte();
        
        switch(protocol){
            case Protocol.PlayerMove:
                const moveId = byteReader.readInt();
                const playerDirection = byteReader.readVector3();

                console.log("update dirc id: " , moveId, "pos : ", playerDirection);

                UpdatePlayerDirection(socket, id, playerDirection);
                break;
            case Protocol.SyncPosition:
                const syncId = byteReader.readInt();
                const playerPos = byteReader.readVector3();

                console.log("update pos id: " , moveId, "pos : ", playerPos);

                UpdatePlayerPos(socket, syncId, playerPos);
                break;
        }
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
