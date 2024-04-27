const net = require('net');
const {ByteReader} = require('../Network');
const sockets = new Set();

const server = net.createServer((socket) =>
{
    console.log('새로운 클라이언트 접속 : ', socket.remoteAddress,socket.remotePort);
    sockets.add(socket);

    socket.on('data',(data)=> 
    {
        console.log('클라이언트 메시지 : ',data.toString());

        sockets.forEach((clientSocket)=>
        {
            if(clientSocket !== socket)
            {
                clientSocket.write(data);
            }
        });
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

server.listen(30303,() => 
{
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.')
});