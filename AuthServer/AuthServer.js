const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

const { Login, Signup } = require('./EventHandler');

io.on('connection', (socket) => {
    //console.log('a user connected : ', socket.remoteAddress + ":" + socket.remotePort);

    socket.on('login', (msg) => {
        console.log('login : ', msg);
        Login(socket, msg);
        
    });

    socket.on('signup', (msg) => {
        console.log('signup : ', msg);
        Signup(socket, msg);
    });
    console.log("연결됨 : " + socket.id);

    socket.on('disconnect', () => {
        console.error('user disconnected : ', socket.remoteAddress + ":" + socket.remotePort);
    });
});


server.listen(10101, () => {    
    console.log('Example app listening on port 10101!');
}).on('error', (err) => {
    console.error('Server error : ', err);
});
