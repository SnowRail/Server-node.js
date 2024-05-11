require("socket.io");
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const logger = require('./logger');
const crypto = require('crypto');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const {
    MatchPacket
} = require('./Packet');

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
    const loginUser = userData.email;
    const emailSplit = userData.email.split('@');
    const loginID = emailSplit[0];
    const defaultLogin = emailSplit.length > 1 ? false : true;

    connection.query('SELECT * FROM User WHERE email = ?', [loginUser], (err, rows) => {
        if (err) {
            logger.error('Login query error:', err);
            socket.emit('loginFail', 'first login fail');
            return;
        }
        if (rows.length === 0) { // 등록되지 않은 사용자
            let newName;
            do {
                newName = crypto.randomBytes(8).toString('hex');
            } while (isUniqueName(newName));

            connection.query("INSERT INTO User (email, id, name) VALUES (?, ?, ?)", [loginUser, loginID, newName], (err) => {
                if (err) {
                    logger.error('Signup query error:', err);
                    socket.emit('signupFail', '회원 등록에 실패했습니다');
                    return;
                }
                connection.query('SELECT * FROM User WHERE email = ?', [loginUser], (err, rows) => {
                    if (err) {
                        logger.error('Login query error:', err);
                        socket.emit('loginFail', 'second login fail');
                        return;
                    }
                    else {
                        const queryResult = rows[0];
                        console.log("query : ", queryResult);
                        socket.emit('inquiryPlayer', JSON.stringify(queryResult));
                        socket.id = loginID;
                        connectedPlayers.set(loginID, {socket : socket, room : null});
                    }
                });
            });
        }
        else {
            const queryResult = rows[0];
            console.log("query : ", queryResult);
            socket.emit('inquiryPlayer', JSON.stringify(queryResult));
            connectedPlayers.set(loginID, {socket : socket, room : null});
        }
        if (defaultLogin) {
            socket.emit('loginSucc', 'default login succ');
        }
    });
}

function Signup(socket, msg) {
    const userData = JSON.parse(msg);
    
    connection.query('SELECT * FROM User WHERE email = ?', [userData.email], (err, rows) => {
        if (err) {
            logger.error('Signup query error:', err);
            socket.emit('signupFail', 'signup fail');
            return;
        }

        if (rows.length === 0) {
            connection.query("INSERT INTO User (email, password, name) VALUES (?, ?, ?)", [userData.email, userData.password, userData.name], (err) => {
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

function SetName(socket, msg) // name change
{
    const userData = JSON.parse(msg);
    connection.query('UPDATE User SET name = ? WHERE id = ?', [userData.name, userData.id], (err) => {
        if (err) {
            logger.error('SetName query error:', err);
            socket.emit('setNameFail', 'setName fail');
            return;
        }
        socket.emit('setNameSucc', 'setName succ');
    });
}

function MatchMaking(msg)
{
    const userData = JSON.parse(msg);
    if(readyRoomList.size === 0)
    {
        const roomID = makeRoomID();
        readyRoomList.set(roomID, {userList : new Map(), readyCount : 0});
    }
    const firstRoomID = readyRoomList.keys().next().value;
    const userList = readyRoomList.get(firstRoomID).userList;
    userList.set(userData.id, false);

    const player = getPlayer(userData.id);
    //player.socket.join(firstRoomID);

    player.socket.on('error', (err) => {
        player.socket.emit('enterRoomFail', 'Enter Room Fail!!');
        logger.error('Enter Room Fail!! : ', err);
    });

    if(userList.size === 2)
    {
        const sendList = getMatchList(userList);

        sendList.forEach(id => {
            const user = getPlayer(id);
            user.socket.emit('enterRoomSucc', JSON.stringify(sendList));        
        });
        logger.info('Enter Room Succ!!');
    }
}

function ReadyGame(msg) {
    const userData = JSON.parse(msg);
    const roomID = userData.roomID;
    const userList = readyRoomList.get(roomID).userList;
}

function enterInGame(roomID, userList) {
    gameRoomList.set(roomID, userList);
    readyRoomList.delete(roomID);
    userList.forEach(id => {
        const user = getPlayer(id);
        user.socket.emit('enterInGame', 'Enter InGame');
    });
}

function getPlayer(id){
    return connectedPlayers.get(id);
}

function isUniqueName(name) { // 중복 있으면 true, 없으면 false
    connection.query('SELECT * FROM User WHERE name = ?', [name], (err, rows) => {
        if (err) {
            logger.error('setUniqueName query error:', err);
            throw err;
        }

        if (rows.length === 0) {
            return false;
        } else {
            return true;
        }
    });
}

function makeRoomID(){
    let num = 0;
    do {
        num = Math.floor(Math.random() * (1000 - 0 + 1)) + 0;
    } while(gameRoomList.has(num) || readyRoomList.has(num));
    return num;
}

function getMatchList(userList) {
    const keyList = Array.from(userList.keys());
    keyList.forEach(id => {
        const player = getPlayer(id);
        connection.query('SELECT * FROM User WHERE id = ?', [id], (err, rows) => {
            if (err) {
                logger.error('MatchMaking query error:', err);
                player.socket.emit('enterRoomFail', 'query error');
                return;
            }
            if (rows.length === 0) {
                player.socket.emit('enterRoomFail', 'query error');
                return;
            }
            else {
                const userInfo = new MatchPacket(rows[0].id, rows[0].name, rows[0].curCart);
                sendList.push(JSON.stringify(userInfo));
            }
        });
    });
    return sendList;
}

function Disconnect(socket) {
    connectedPlayers.delete(socket.id);
}

module.exports = {
    Login,
    Signup,
    SetName,
    MatchMaking,
    ReadyGame,
    Disconnect
}