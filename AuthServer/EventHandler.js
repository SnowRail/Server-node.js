require("socket.io");
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const logger = require('./logger');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const connectedPlayers = new Map();
const readyRoomList = new Map();
const gameRoomList = new Map();

connection.connect((err) => {
    if (err) {
        logger.error('MySQL connection error:', err);
        process.exit(1);
    } else {
        logger.info('MySQL connection success');
    }
});


function Login(socket, msg) {
    const userData = JSON.parse(msg);

    connection.query('SELECT * FROM User WHERE id = ?', [userData.email], (err, rows) => {
        if (err) {
            logger.error('Login query error:', err);
            socket.emit('loginFail', 'login fail');
            return;
        }

        if (rows.length === 0) { // 등록되지 않은 사용자
            connection.query("INSERT INTO User (id) VALUES (?)", [userData.email], (err) => {
                if (err) {
                    logger.error('Signup query error:', err);
                    socket.emit('signupFail', '회원 등록에 실패했습니다');
                    return;
                }
                socket.emit('loginSucc', `${userData.email}님 로그인에 성공했습니다.`);
            });
        } else {
            socket.emit('loginSucc', `${rows[0].name}님 로그인에 성공했습니다.`);
            connectedPlayers.set(userData.email, {socket : socket, room : null});
        }
    });
}

function Signup(socket, msg) {
    const userData = JSON.parse(msg);
    
    connection.query('SELECT * FROM User WHERE id = ?', [userData.id], (err, rows) => {
        if (err) {
            logger.error('Signup query error:', err);
            socket.emit('signupFail', 'signup fail');
            return;
        }

        if (rows.length === 0) {
            connection.query("INSERT INTO User (id, password, name) VALUES (?, ?, ?)", [userData.id, userData.password, userData.name], (err) => {
                if (err) {
                    logger.error('Signup query error:', err);
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

function MatchMaking(msg)
{
    const userData = JSON.parse(msg);
    if(readyRoomList.size === 0)
    {
        const roomID = makeRoomID();
        readyRoomList.set(roomID, []);
    }
    const firstRoomID = readyRoomList.keys().next().value;
    const userList = readyRoomList.get(firstRoomID);
    userList.push(userData.id);

    const player = getPlayer(userData.id);
    player.socket.join(firstRoomID);

    player.socket.on('error', (err) => {
        player.socket.emit('enterRoomFail', 'Enter Room Fail!!');
        logger.error('Enter Room Fail!! : ', err);
    });

    player.socket.emit('enterRoomSucc', 'Enter Room Succ!!');
    logger.info('Enter Room Succ!!');
    
    if(userList.length === 2)
    {
        gameRoomList.set(firstRoomID,userList);
        readyRoomList.delete(firstRoomID);
        userList.forEach(element => {
            const user = getPlayer(element);
            user.socket.emit('LoadGameScene', "매칭완료 게임하러 가는 중! 칙칙폭폭!!");
            // TODO : 대기실 구성을 위한 유저 리스트 정보 전달하기
        });
    }
}

function getPlayer(id){
    return connectedPlayers.get(id);
}

function makeRoomID(){
    let num = 0;
    do {
        num = Math.floor(Math.random() * (1000 - 0 + 1)) + 0;
    } while(gameRoomList.has(num) || readyRoomList.has(num));
    return num;
}



module.exports = {
    Login,
    Signup,
    MatchMaking
}