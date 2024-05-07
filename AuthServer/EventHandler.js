const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'outgame-database.cin32mhxbadg.ap-northeast-2.rds.amazonaws.com',
    port : 3306,
    user: 'admin',
    password: 'vibracoffee',
    database: 'outgame-database'
});

connection.connect((err) => {
    if(err) {
        console.log('mysql connection error : ', err);
        return;
    } else {
        console.log('mysql connection success');
    }
});

function Login(socket, msg) {
    const userData = JSON.parse(msg);
    msg.id;
    msg.pw;

    // db에 없으면 
    // socket.emit('loginFail', 'login fail');  

    // db에 있으면
    socket.emit('loginSucc', 'login success');
}

function Signup(socket, msg) {
    // db에 이미 있는 아이디면 
    // socket.emit('signupFail', 'signup fail');

    // db에 없는 아이디면
    socket.emit('signupSucc', 'signup success');
}

module.exports = {
    Login,
    Signup
}