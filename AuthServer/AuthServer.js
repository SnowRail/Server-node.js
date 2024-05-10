const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

const {   
    Login, 
    Signup,
    MatchMaking 
} = require('./EventHandler');

io.on('connection', (socket) => {
    //console.log('a user connected : ', socket.remoteAddress + ":" + socket.remotePort);
    console.log("연결됨 : " + socket.id);

    socket.on('login', (msg) => {
        console.log('login : ', msg);
        Login(socket, msg);
    });

    socket.on('signup', (msg) => {
        console.log('signup : ', msg);
        Signup(socket, msg);
    });
    
    socket.on('matching', (msg) => {
        console.log('matching : ', msg);
        MatchMaking(msg);
    });

    socket.on('disconnect', () => {
        console.error('user disconnected : ', socket.remoteAddress + ":" + socket.remotePort);
        // TODO 접속한 플레이어 리스트에서 삭제하기
    });
});


server.listen(10101, () => {    
    console.log('Example app listening on port 10101!');
    console.log("배포 테스트 Auth");
}).on('error', (err) => {
    console.error('Server error : ', err);
});
