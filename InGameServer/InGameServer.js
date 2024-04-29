const net = require('net');
const { ByteReader, ByteWriter } = require('../Network');
const Protocol = require('./Protocol');
const NetworkObjectManager = require('./NetworkObjectManager');
const UnityInstance = require('./UnityClass/UnityInstance');
const { intSize, floatSize } = require('./typeSize');
const SocketManager = require('./SoketManager');

const {
    FirstConn,
    broadcast,
    UpdatePlayerPos,
    DestroyPlayer,
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

    // const buffer = Buffer.alloc(intSize*2);
    // const bytewriter = new ByteWriter(buffer);
    // bytewriter.writeInt(Protocol.s_PlayerConnect);
    // bytewriter.writeInt(sockets.size-1)
    // socket.write(buffer);
    FirstConn(socket,num);
    
    

    socket.on('data',(data)=> 
    {
        const byteReader = new ByteReader(data);
        const protocol = byteReader.readInt();
        
        
        switch(protocol){
            case Protocol.c_PlayerPosition:
                const id = byteReader.readInt();
                const playerPos = byteReader.readVector2()
                // console.log('PlayerID :' , id);
                // console.log('PlayerPosition :' , playerPos);
            
                UpdatePlayerPos(socket,id, playerPos);
                break;
            
        }

    });

    socket.on('end',() =>
    {
        console.log('클라이언트 접속 종료 : ', socket.remoteAddress,socket.remotePort);
        SocketManager.removeSocket(socket);
        DestroyPlayer(socket,socket.clientID);
    });


    socket.on('error',(err)=>
    {
        console.error('소켓 에러 : ', err);
        SocketManager.removeSocket(socket);
    });
});



server.listen(30303,() => 
{
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.')
});
