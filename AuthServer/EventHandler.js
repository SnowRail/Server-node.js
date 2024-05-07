const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port : process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

connection.connect((err) => {
    if(err) {
        console.error('mysql connection error : ', err);
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

connection.end((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
      process.exit(1); // 에러 발생 시 프로세스 종료
    }
    console.log('Database connection closed');
  });

module.exports = {
    Login,
    Signup
}