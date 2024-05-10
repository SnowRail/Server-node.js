const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const logger = require('./logger');

const {   
    Login, 
    Signup,
    MatchMaking 
} = require('./EventHandler');

io.on('connection', (socket) => {
    logger.info(`새로운 클라이언트 접속 : ${socket.handshake.address}`);
    socket.on('login', (msg) => {
        logger.info('login : ' + JSON.stringify(msg));
        Login(socket, msg);
    });

    socket.on('signup', (msg) => {
        logger.info('signup : ', + JSON.stringify(msg));
        Signup(socket, msg);
    });
    
    socket.on('matching', (msg) => {
        logger.info('matching : ', + JSON.stringify(msg));
        MatchMaking(msg);
    });

    socket.on('disconnect', () => {
        logger.info(`클라이언트 접속 종료 : ${socket.handshake.address}`);
        // TODO 접속한 플레이어 리스트에서 삭제하기
    });
});


server.listen(10101, () => {    
    logger.info('서버가 10101번 포트에서 실행 중입니다. ');
}).on('error', (err) => {
    logger.error('Server error : ', err);
});
