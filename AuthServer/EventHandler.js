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
    //const userData = JSON.parse(msg);

    connection.query('SELECT * FROM User WHERE id = ? AND pw = ?', [msg.id, msg.pw], (err, rows) => {
        if (err) {
            console.error('Login query error:', err);
            socket.emit('loginFail', 'login fail');
            return;
        }

        if (rows.length === 0) {
            socket.emit('loginFail', '존재하지 않는 ID거나 비밀번호가 틀렸습니다');
        } else {
            socket.emit('loginSucc', `${rows[0].name}님 로그인에 성공했습니다.`);
        }
    });
}

function Signup(socket, msg) {
    //const userData = JSON.parse(msg);

    connection.query('SELECT * FROM User WHERE id = ?', [msg.id], (err, rows) => {
        if (err) {
            console.error('Signup query error:', err);
            socket.emit('signupFail', 'signup fail');
            return;
        }

        if (rows.length === 0) {
            connection.query('INSERT INTO User (id, pw, name) VALUES (?, ?, ?)', [msg.id, msg.pw, msg.name], (err) => {
                if (err) {
                    console.error('Signup query error:', err);
                    socket.emit('signupFail', '회원가입에 실패했습니다');
                    return;
                }

                socket.emit('signupSucc', '회원가입에 성공했습니다');
            });
        } else {
            socket.emit('signupFail', '이미 존재하는 ID입니다');
        }
    });
}


module.exports = {
    Login,
    Signup
}