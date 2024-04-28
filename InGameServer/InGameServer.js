const net = require('net');
const { ByteReader, ByteWriter } = require('../Network');
const Protocol = require('./Protocol');
const NetworkObjectManager = require('./NetworkObjectManager');
const UnityInstance = require('./UnityClass/UnityInstance');
const { intSize, floatSize } = require('./typeSize');
const sockets = new Set();


const server = net.createServer((socket) =>
{
    socket.name = socket.remoteAddress + ":" + socket.remotePort;
    socket.clientID = sockets.size;
    socket.syncCount = 0;
    sockets.add(socket);
    console.log('새로운 클라이언트 접속 : ', socket.name);
    console.log('클라이언트 ID : ' + socket.clientID);
    

    const buffer = Buffer.alloc(intSize*2);
    const bytewriter = new ByteWriter(buffer);
    bytewriter.writeInt(Protocol.s_PlayerConnect);
    bytewriter.writeInt(sockets.size)
    socket.write(buffer);
    // broadcast("newPlayer", socket);
    
    

    socket.on('data',(data)=> 
    {
        const byteReader = new ByteReader(data);
        const protocol = byteReader.readInt();
        
        
        switch(protocol){
            case Protocol.c_PlayerPosition:
                const id = byteReader.readInt();
                const playerPos = byteReader.readVector2()
                console.log('PlayerID :' , id);
                console.log('PlayerPosition :' , playerPos);

                const sendData = Buffer.alloc((intSize*2) + (floatSize*2));
                const bw = new ByteWriter(sendData);
                bw.writeInt(Protocol.s_PlayerPosition);
                bw.writeInt(id);
                bw.writeVector2(playerPos);
                // console.log('senddata : ',sendData);
                broadcast(sendData, socket);
                break;
            
        }

    });

    socket.on('end',() =>
    {
        console.log('클라이언트 접속 종료 : ', socket.remoteAddress,socket.remotePort);
        sockets.delete(socket);
    });


    socket.on('error',(err)=>
    {
        console.error('소켓 에러 : ', err);
        sockets.delete(socket);
    });
});

function broadcast(message, sender) {
    sockets.forEach((socket) => {
        if (socket == sender) return;

        socket.write(message);
    });
}

server.listen(30303,() => 
{
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.')
});

module.exports = {
    broadcast
};