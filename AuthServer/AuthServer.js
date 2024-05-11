const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

const net = require('net');
const tcpClient = new net.Socket();

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const serverIP = process.env.SERVER_IP || 'localhost';
const logger = require('./logger');

const {   
    Login, 
    Signup,
    SetName,
    MatchMaking,
    ReadyGame,
    Disconnect 
} = require('./EventHandler');

io.on('connection', (socket) => {
    logger.info(`새로운 클라이언트 접속 : ${socket.handshake.address}`);
    socket.on('login', (msg) => { // 일반 login
        logger.info('login : ' + JSON.stringify(msg));
        Login(socket, msg);
    });
    socket.on('loginSucc', (msg) => { // email 정보
        logger.info('login : ' + JSON.stringify(msg));
        Login(socket, msg);
    });
    
    socket.on('signup', (msg) => {
        logger.info('signup : ' + JSON.stringify(msg));
        Signup(socket, msg);
    });

    socket.on('setName', (msg) => {
        logger.info('setName : ' + JSON.stringify(msg));
        SetName(socket, msg);
    });
    
    socket.on('matching', (msg) => { // client의 matching 요청
        logger.info('matching : ' + JSON.stringify(msg));
        MatchMaking(msg);
    });

    socket.on('readyGame', (msg) => {
        logger.info('beforeStart : ' + JSON.stringify(msg));
        ReadyGame(msg);
    });

    socket.on('disconnect', () => {
        logger.info(`클라이언트 접속 종료 : ${socket.handshake.address}`);
        // TODO 접속한 플레이어 리스트에서 삭제하기
        Disconnect(socket);
    });
});

server.listen(10101, () => {    
    logger.info('서버가 10101번 포트에서 실행 중입니다. ');
}).on('error', (err) => {
    logger.error('Server error : ', err);
});


tcpClient.connect(30304, serverIP, () => {
    console.log('TCP 서버에 연결되었습니다.');
    tcpClient.write('안녕하세요');
});

tcpClient.on('data', (data) => {
    console.log('TCP 서버로부터 온 데이터 : ', data.toString());
});