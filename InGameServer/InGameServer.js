const net = require('net');
const { ByteReader, ByteWriter } = require('../Network');
const Protocol = require('./Protocol');
const NetworkObjectManager = require('./NetworkObjectManager');
const UnityInstance = require('./UnityInstance');
const sockets = new Set();

const server = net.createServer((socket) =>
{
    console.log('새로운 클라이언트 접속 : ', socket.remoteAddress,socket.remotePort);
    sockets.add(socket);

    const buffer = Buffer.alloc(8);
    const bytewriter = new ByteWriter(buffer);
    bytewriter.writeInt(Protocol.PlayerConnect);
    bytewriter.writeInt(sockets.size)
    socket.write(buffer);
    broadcast("newPlayer", socket);
    
    

    socket.on('data',(data)=> 
    {
        const byteReader = new ByteReader(data);
        const protocol = byteReader.readInt();
        
        console.log('bytereader : ' , byteReader.readInt());
        switch(protocol){
            case Protocol.PlayerConnect:
                parseInstantiate(socket,data);
                console.log('player connect');
                break;
            case Protocol.PlayerCheckConn:

            case Protocol.PlayerPosition:
                console.log('PlayerPosition :' , Protocol.c_PlayerPosition);
                broadcast(data, socket);
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

function parseInstantiate(socket,data){
    const byteReader = new ByteReader(data,4);
    // const protocol = byteReader.readByte();
    
    const clientID = byteReader.readInt();
    console.log("clientID : ",clientID);
}


server.listen(30303,() => 
{
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.')
});

module.exports = {
    broadcast
};