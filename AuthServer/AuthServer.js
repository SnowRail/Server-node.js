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
const { log } = require('console');

io.on('connection', (socket) => {
    //console.log('a user connected : ', socket.remoteAddress + ":" + socket.remotePort);
    logger.info("연결됨 : " + socket.id);
    socket.on('login', (msg) => {
        logger.info('login : ', msg);
        Login(socket, msg);
    });

    socket.on('signup', (msg) => {
        logger.info('signup : ', msg);
        Signup(socket, msg);
    });
    
    socket.on('matching', (msg) => {
        logger.info('matching : ', msg);
        MatchMaking(msg);
    });

    socket.on('disconnect', () => {
        logger.error('user disconnected : ', socket.remoteAddress + ":" + socket.remotePor);
        // TODO 접속한 플레이어 리스트에서 삭제하기
    });
});


server.listen(10101, () => {    
    logger.info('서버가 10101번 포트에서 실행 중입니다.');
}).on('error', (err) => {
    logger.error('Server error : ', err);
});
