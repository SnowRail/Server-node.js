const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

const net = require('net');
//const tcpClient = new net.Socket();

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const serverIP = process.env.SERVER_IP;
const serverPORT = process.env.SERVER_PORT;
const io2 = require('socket.io-client');
const interServerSocket = io2('http://'+serverIP+':'+serverPORT);
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

    socket.on('inquiryFriend', (msg) => {
        logger.info('setName : ' + JSON.stringify(msg));
        SetName(socket, msg);
    });

    socket.on('setName', (msg) => {
        logger.info('setName : ' + JSON.stringify(msg));
        SetName(socket, msg);
    });
    
    socket.on('matching', (msg) => { // client의 matching 요청
        logger.info('matching : ' + JSON.stringify(msg));
        MatchMaking(msg, tcpClient);
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

    socket.on('close', (reason) => {
        logger.info(`클라이언트 연결 종료 : ${socket.handshake.address}, 이유 : ${reason}`);
        Disconnect(socket);
    });

});

server.listen(10101, () => {    
    logger.info('서버가 10101번 포트에서 실행 중입니다. ');
}).on('error', (err) => {
    logger.error('Server error : ', err);
});


// InGameServer와 웹소켓으로 통신
interServerSocket.on('connect', () => {
    console.log('아웃게임 서버에 접속했습니다.');
});

interServerSocket.on('connect_error', (error) => {
    console.error('아웃게임 서버 연결 에러:', error);
});

interServerSocket.on('message', (data) => {
    console.log(`아웃게임 서버로부터 받은 메시지: ${data}`);
});