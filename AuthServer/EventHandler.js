require("socket.io");
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const logger = require('./logger');
const crypto = require('crypto');

let IngameServer = null;

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const {
    Packet,
    MatchPacket
} = require('./Packet');
const { log } = require("console");

const connectedPlayers = new Map();
const matchRoomList = new Map();
const readyRoomList = new Map();
const gameRoomList = new Map();


connection.connect((err) => {
    if (err) {
        logger.error(`MySQL connection error: ${err}`);
        process.exit(1);
    } else {
        logger.info('MySQL connection success');
    }
});

function SetInGameServer(server) {
    IngameServer = server;
}

function Login(socket, msg) {
    const userData = JSON.parse(msg);
    const loginUser = userData.email;
    const emailSplit = userData.email.split('@');
    const defaultLogin = emailSplit.length > 1 ? false : true;

    if (defaultLogin) { // 기본 로그인
        const loginPW = userData.password;
        connection.query('SELECT * FROM User WHERE email = ? AND password = ?', [loginUser, loginPW], (err, rows) => {
            if (err) {
                logger.error(`Login query error: ${err}`);
                socket.emit('loginFail', 'login query fail');
                return;
            }
            if (rows.length === 0) { // 등록되지 않은 사용자
                logger.error(`등록되지 않은 사용자: ${err}`);
                socket.emit('loginFail', '존재하지 않는 ID 또는 비밀번호입니다');
            }
            else {
                const queryResult = new Packet(rows[0].email, null, rows[0].nickname);
                console.log("query : ", queryResult);
                socket.emit('loginSucc', 'default login succ');
                socket.emit('inquiryPlayer', JSON.stringify(queryResult));
                socket.id = rows[0].nickname;
                connectedPlayers.set(rows[0].nickname, {socket : socket, room : null, state : 'lobby'});
            }
        });
    } else // google login
    {   connection.query('SELECT * FROM User WHERE email = ?', [loginUser], (err, rows) => {
            if (err) {
                logger.error(`Login query error: ${err}`);
                socket.emit('loginFail', 'first login fail');
                return;
            }
            if (rows.length === 0) { // 등록되지 않은 사용자
                let newName;
                do {
                    newName = crypto.randomBytes(8).toString('hex');
                } while (!isUniqueName(newName));

                connection.query("INSERT INTO User (email, nickname) VALUES (?, ?)", [loginUser, newName], (err) => {
                    if (err) {
                        logger.error(`Signup query error: ${err}`);
                        socket.emit('signupFail', '회원 등록에 실패했습니다');
                        return;
                    }
                    connection.query('SELECT * FROM User WHERE email = ?', [loginUser], (err, rows) => {
                        if (err) {
                            logger.error(`Login query error: ${err}`);
                            socket.emit('loginFail', 'second login fail');
                            return;
                        }
                        else {
                            const queryResult = new Packet(rows[0].email, null, rows[0].nickname);
                            console.log("query : ", queryResult);
                            socket.emit('inquiryPlayer', JSON.stringify(queryResult));
                            socket.id = rows[0].nickname;
                            connectedPlayers.set(rows[0].nickname, {socket : socket, room : null, state : 'lobby'});
                        }
                    });
                });
            }
            else {
                const queryResult = new Packet(rows[0].email, null, rows[0].nickname);
                console.log("query : ", queryResult);
                socket.emit('inquiryPlayer', JSON.stringify(queryResult));
                socket.id = rows[0].nickname;
                connectedPlayers.set(rows[0].nickname, {socket : socket, room : null, state : 'lobby'});
            }
            
        });
    }
}

function Signup(socket, msg) {
    const userData = JSON.parse(msg);
    
    connection.query('SELECT * FROM User WHERE email = ?', [userData.email], (err, rows) => {
        if (err) {
            logger.error(`Signup query error: ${err}`);
            socket.emit('signupFail', 'signup fail');
            return;
        }

        if (rows.length === 0) {
            connection.query("INSERT INTO User (email, password, nickname) VALUES (?, ?, ?)", [userData.email, userData.password, userData.nickname], (err) => {
                if (err) {
                    logger.error(`Signup query error: ${err}`);
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

function SetName(socket, msg) // name change 여기 아마 패킷 다를듯
{
    const userData = JSON.parse(msg);
    logger.info(userData.nickname);
    if(isUniqueName(userData.nickname))
    {
        connection.query('UPDATE User SET nickname = ? WHERE email = ?', [userData.nickname, userData.email], (err) => {
            if (err) {
                logger.error(`SetName query error: ${err}`);
                socket.emit('setNameFail', 'setName fail');
                return;
            }
            socket.emit('setNameSucc', userData.nickname);
            connectedPlayers.set(userData.nickname, {socket : socket, room : null, state : 'lobby'});
            connectedPlayers.delete(socket.id);
            socket.id = userData.nickname;
        });
    }
    else
    {
        socket.emit('setNameFail', '중복된 닉네임입니다.')
    }
}

function MatchMaking(socket, msg)
{
    const userData = JSON.parse(msg);
    const player = getPlayer(userData.nickname);
    if(player === undefined)
    {
        logger.error(`[MatchMaking] Player is undefined, name : ${userData.nickname}`);
        socket.emit('enterRoomFail', 'Player is undefined');
        return;
    }
    if(matchRoomList.size === 0)
    {
        const roomID = makeRoomID();
        matchRoomList.set(roomID, []);
    }
    //const firstRoomID = matchRoomList.keys().next().value;
    let firstRoomID;
    for (const roomid of matchRoomList.keys()) {
        firstRoomID = roomid;
        break;
    }
    const matchList = matchRoomList.get(firstRoomID);
    matchList.push(userData.nickname);
    
    player.socket.on('error', (err) => {
        logger.error(`Enter Room Fail!! : ${err}`);
        player.socket.emit('enterRoomFail', 'Enter Room Fail!!');
    });
    player.room = firstRoomID;
    player.state = 'matching';

    if(matchList.length === 5 && !matchList.processed)
    {
        matchList.processed = true; // 처리 플래그 설정
        processMatchList(matchList, firstRoomID);
        sendMatchList(firstRoomID, matchList);
    }
    else if(!matchList.timeoutId)
    {
        const timeoutId = setTimeout(() => {
            if (!matchList.processed) {
                processMatchList(matchList, firstRoomID);
                sendMatchList(firstRoomID, matchList);
            }
        },120000); // 120초 (120000ms) 후에 실행

        matchList.timeoutId = timeoutId; // 매치리스트에 타임아웃 ID 저장
    }
}

function processMatchList(matchList, roomID) {
    const matchPromise = getMatchList(matchList, roomID);
    readyRoomList.set(roomID, {userList : matchList});
    matchPromise.then(sendList => {
        sendList.forEach(element => {
            const user = getPlayer(element.nickname);
            if (user === undefined) {
                logger.error(`[processMatchList] user is undefined, name : ${element.nickname}`);
            } else {
                user.socket.emit('enterRoomSucc', '{"roomID":' + roomID + ',"playerList":' + JSON.stringify(sendList) + '}' ); 
                user.state = 'ready';      
            }
        });
        logger.info(`Enter Room Succ!! room : ${roomID}`);

        matchRoomList.delete(roomID);

        // 5초 후에 moveInGameScene 이벤트 emit
        gameRoomList.set(roomID, {userList : matchList});
        setTimeout(() => {
            sendList.forEach(element => {
                const user = getPlayer(element.nickname);
                if (user === undefined) {
                    logger.error(`[processMatchList] user is undefined, name : ${element.nickname}`);
                } else {
                    user.socket.emit('loadGameScene', 'Move to in-game scene');
                    user.state = 'ingame'
                }
            });
            logger.info('Move to in-game scene');
        }, 5000); // 5초 (5000ms) 후에 실행
        readyRoomList.delete(roomID);
    });
}

function ReadyGame(msg) {
    const userData = JSON.parse(msg);
    const roomID = userData.roomID;
    const userList = readyRoomList.get(roomID).userList;
}



function getPlayer(nickname){
    return connectedPlayers.get(nickname);
}

async function isUniqueName(nickname) { // 중복 없으면 true, 있으면 false
    await connection.query('SELECT * FROM User WHERE nickname = ?', [nickname], (err, rows) => {
        if (err) {
            logger.error(`setUniqueName query error: ${err}`);
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

function getMatchList(userList, roomID) {

    const promises = userList.map(nickname => {
        return new Promise((resolve, reject) => {
            const player = getPlayer(nickname);
            if (player === undefined) {
                console.log("[getMatchList] player is undefined, name : ", nickname);
                return;
            }
            connection.query('SELECT * FROM User WHERE nickname = ?', [nickname], (err, rows) => {
                if (err) {
                    logger.error(`MatchMaking query error: ${err}`);
                    player.socket.emit('enterRoomFail', 'query error');
                    reject(err);
                }
                if (rows.length === 0) {
                    logger.error(`MatchMaking 존재하지 않는 유저: ${err}`);
                    player.socket.emit('enterRoomFail', 'query error');
                    resolve();
                }
                else {
                    const userInfo = new MatchPacket(rows[0].nickname, roomID);
                    resolve(userInfo);
                }
            });
        });
    });

    return Promise.all(promises).then(sendList => {
        return sendList;
    });
}

function Disconnect(socket) {
    const disconnectPlayer = connectedPlayers.get(socket.id);
    if (!disconnectPlayer) {
        return;
    }
    switch(disconnectPlayer.state){
        case 'lobby':
            console.log("Lobby 접속 끊김 : ", socket.id);
            break;
        case 'matching':
            const matchList = matchRoomList.get(disconnectPlayer.room);
            matchList.splice(matchList.indexOf(socket.id), 1);
            console.log("매칭 중 접속 끊김 : ", socket.id);
            if(matchList.length === 0)
            {
                matchRoomList.delete(disconnectPlayer.room);
            }
            break;
        case 'ready':
            const readyList = readyRoomList.get(disconnectPlayer.room);
            readyList.userList.splice(readyList.userList.indexOf(socket.id), 1);
            console.log("Ready 중 접속 끊김 : ", socket.id);
            if(readyList.userList.length === 0)
            {
                readyRoomList.delete(disconnectPlayer.room);
            }
            break;
        case 'ingame':
            console.log("Ingame 중 접속 끊김 : ", socket.id);
            break;
    }
    connectedPlayers.delete(socket.id);
}


// --------------- Server <-> Server -------------------------------
function sendMatchList(roomID, matchList)
{
    IngameServer.emit('enterInGame', '{"roomID":' + roomID + ',"playerList":' + JSON.stringify(matchList) + '}');
}

module.exports = {
    Login,
    Signup,
    SetName,
    MatchMaking,
    ReadyGame,
    Disconnect,
    SetInGameServer
}