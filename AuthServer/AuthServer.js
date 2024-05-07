const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const { Login, Signup } = require('./EventHandler');

io.on('connection', (socket) => {
    console.log('a user connected : ', socket.remoteAddress + ":" + socket.remotePort);

    socket.on('login', (msg) => {
        console.log('login : ', msg);
        Login(socket, msg);
        
    });

    socket.on('signup', (msg) => {
        console.log('signup : ', msg);
        socket.emit('signup', 'signup success');
    });



    socket.on('disconnect', () => {
        console.error('user disconnected : ', socket.remoteAddress + ":" + socket.remotePort);
    });
});




app.listen(10101, () => {    
    console.log('Example app listening on port 10101!');
});