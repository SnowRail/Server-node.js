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
const { log } = require("console");

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
            } while (!isUniqueName(newName));

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
    logger.info(userData.name);
    if(isUniqueName(userData.name))
    {
        connection.query('UPDATE User SET name = ? WHERE id = ?', [userData.name, userData.id], (err) => {
            if (err) {
                logger.error('SetName query error:', err);
                socket.emit('setNameFail', 'setName fail');
                return;
            }
            socket.emit('setNameSucc', "닉네임이 변경되었습니다.");
        });
    }
    else
    {
        socket.emit('setNameFail', '중복된 닉네임입니다.')
    }
}

function MatchMaking(msg)
{
    const userData = JSON.parse(msg);
    if(readyRoomList.size === 0)
    {
        const roomID = makeRoomID();
        readyRoomList.set(roomID, {userList : new Map(), readyCount : 0});
    }
    //const firstRoomID = readyRoomList.keys().next().value;
    let firstRoomID;
    for (const roomid of readyRoomList.keys()) {
        firstRoomID = roomid;
        break;
    }
    const matchList = readyRoomList.get(firstRoomID).userList;
    matchList.set(userData.id, false);
    
    const player = getPlayer(userData.id);
    //player.socket.join(firstRoomID);

    player.socket.on('error', (err) => {
        player.socket.emit('enterRoomFail', 'Enter Room Fail!!');
        logger.error('Enter Room Fail!! : ', err);
    });

    if(matchList.size === 2)
    {
        console.log('userList : ', matchList);
        const sendList = getMatchList(matchList);
        console.log('sendList : ', sendList);
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

async function isUniqueName(name) { // 중복 없으면 true, 있으면 false
    await connection.query('SELECT * FROM User WHERE name = ?', [name], (err, rows) => {
        if (err) {
            logger.error('setUniqueName query error:', err);
            
        }
        if (rows.length === 0) {
            return true;
        } else {
            return false;
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
    const sendList = []; 

    const promises = keyList.map(id => {
        return new Promise((resolve, reject) => {
            const player = getPlayer(id);
            connection.query('SELECT * FROM User WHERE id = ?', [id], (err, rows) => {
                if (err) {
                    logger.error('MatchMaking query error:', err);
                    console.log('query error');
                    player.socket.emit('enterRoomFail', 'query error');
                    reject(err);
                    return;
                }
                if (rows.length === 0) {
                    console.log('뭐가 없음');
                    player.socket.emit('enterRoomFail', 'query error');
                    resolve();
                    return;
                }
                else {
                    const userInfo = new MatchPacket(rows[0].id, rows[0].name, rows[0].curCart);
                    sendList.push(JSON.stringify(userInfo));
                    console.log('push 완료');
                    resolve();
                }
            });
        });
    });

    return Promise.all(promises).then(() => {
        console.log('sendList : ', sendList);
        return sendList;
    });
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