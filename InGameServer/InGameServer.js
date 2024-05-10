const net = require('net');
const Protocol = require('./Protocol');
const SocketManager = require('./SoketManager');
const process = require('process');

const {
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
        const startTime = process.hrtime();
        recvData += data.toString();

        if(recvData.includes('\n'))
        {
            const msg = recvData.split('\n');
            console.log('msg :  ', msg);
            for(let i = 0; i < msg.length-1; ++i)
            {
                const jsonData = JSON.parse(msg[i]);
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
                    case Protocol.GameSync:
                        UpdatePlayerPos(socket, jsonData);
                        break;
                    case Protocol.PlayerBreak:
                        PlayerBreak(socket, jsonData);
                        break;
    
                    case Protocol.ResetServer:
                        ResetServer()
                        break;
    
                }
            }
            const endTime = process.hrtime(startTime);
            const executionTime = endTime[0] * 1e9 + endTime[1];
            console.log('처리시간 : ', executionTime);
            recvData = '';
            recvData += msg[msg.length-1];
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
    console.log('TCP 서버가 30303번 포트에서 실행 중입니다.');
    console.log('배포 테스트 InGame');
});