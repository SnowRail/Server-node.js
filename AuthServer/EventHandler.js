const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        process.exit(1);
    } else {
        console.log('MySQL connection success');
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