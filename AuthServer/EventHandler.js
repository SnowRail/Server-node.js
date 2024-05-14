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
const { send } = require("process");

const connectedPlayers = new Map();
const matchRoomList = new Map();
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

    if (defaultLogin) { // 기본 로그인
        const loginPW = userData.password;
        connection.query('SELECT * FROM User WHERE email = ? AND password = ?', [loginUser, loginPW], (err, rows) => {
            if (err) {
                logger.error('Login query error:', err);
                socket.emit('loginFail', 'login query fail');
                return;
            }
            if (rows.length === 0) { // 등록되지 않은 사용자
                socket.emit('loginFail', '존재하지 않는 ID 또는 비밀번호입니다');
            }
            else {
                const queryResult = rows[0];
                console.log("query : ", queryResult);
                socket.emit('loginSucc', 'default login succ');
                socket.emit('inquiryPlayer', JSON.stringify(queryResult));
                connectedPlayers.set(loginID, {socket : socket, room : null, state : 'lobby'});
            }
        });
    } else // google login
    {   connection.query('SELECT * FROM User WHERE email = ?', [loginUser], (err, rows) => {
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
                            connectedPlayers.set(loginID, {socket : socket, room : null, state : 'lobby'});
                        }
                    });
                });
            }
            else {
                const queryResult = rows[0];
                console.log("query : ", queryResult);
                socket.emit('inquiryPlayer', JSON.stringify(queryResult));
                connectedPlayers.set(loginID, {socket : socket, room : null, state : 'lobby'});
            }
            
        });
    }
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
            connection.query("INSERT INTO User (email, id, password, name) VALUES (?, ?, ?, ?)", [userData.email, userData.email, userData.password, userData.name], (err) => {
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

function MatchMaking(msg, tcpClient)
{
    const userData = JSON.parse(msg);
    const player = getPlayer(userData.id);
    if(player.state === 'matching')
    {
        logger.info("여기 들어오면 매칭중이였음");
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
    matchList.push(userData.id);
    
    player.socket.on('error', (err) => {
        player.socket.emit('enterRoomFail', 'Enter Room Fail!!');
        logger.error('Enter Room Fail!! : ', err);
    });
    player.room = firstRoomID;
    player.state = 'matching';

    if(matchList.length === 2 && !matchList.processed)
    {
        matchList.processed = true; // 처리 플래그 설정
        processMatchList(matchList, firstRoomID);
        tcpClient.write('{"roomID":' + firstRoomID + ',"playerList":' + JSON.stringify(matchList) + '}');
    }
    else if(!matchList.timeoutId)
    {
        const timeoutId = setTimeout(() => {
            if (!matchList.processed) {
                processMatchList(matchList, firstRoomID);
                tcpClient.write('{"roomID":' + firstRoomID + ',"playerList":' + JSON.stringify(matchList) + '}');
            }
        }, 20000); // 20초 (20000ms) 후에 실행

        matchList.timeoutId = timeoutId; // 매치리스트에 타임아웃 ID 저장
    }
}

function processMatchList(matchList, roomID) {
    const matchPromise = getMatchList(matchList,roomID);
    matchPromise.then(sendList => {
        sendList.forEach(element => {
            const user = getPlayer(element.id);
            user.socket.emit('enterRoomSucc', JSON.stringify(sendList)); 
            // user.socket.emit('enterRoomSucc', '{"roomID":' + roomID + ',"playerList":' + JSON.stringify(sendList) + '}' ); 
            user.state = 'ready';      
        });
        logger.info('Enter Room Succ!!');

        readyRoomList.set(roomID, {userList : matchList, readyCount : 0});
        matchRoomList.delete(roomID);

        // 5초 후에 moveInGameScene 이벤트 emit
        setTimeout(() => {
            sendList.forEach(element => {
                const user = getPlayer(element.id);
                user.socket.emit('loadGameScene', 'Move to in-game scene');
                user.state = 'ingame'
            });
            logger.info('Move to in-game scene');
        }, 5000); // 5초 (5000ms) 후에 실행
        gameRoomList.set(roomID, {userList : matchList});
        readyRoomList.delete(roomID);
        // MoveInGameScene(sendList,roomID,tcpClient)
    });
}

function MoveInGameScene(sendList,roomID,tcpClient)
{
    // const data = {
    //     roomID : roomID,
    //     playerList : sendList
    // };
    // const jsonData = JSON.stringify(data);
    // tcpClient.write(jsonData);
}

function ReadyGame(msg) {
    const userData = JSON.parse(msg);
    const roomID = userData.roomID;
    const userList = readyRoomList.get(roomID).userList;
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

function getMatchList(userList, roomID) {
    //const keyList = Array.from(userList.keys());
    //const sendList = []; 

    const promises = userList.map(id => {
        return new Promise((resolve, reject) => {
            const player = getPlayer(id);
            connection.query('SELECT * FROM User WHERE id = ?', [id], (err, rows) => {
                if (err) {
                    logger.error('MatchMaking query error:', err);
                    player.socket.emit('enterRoomFail', 'query error');
                    reject(err);
                }
                if (rows.length === 0) {
                    player.socket.emit('enterRoomFail', 'query error');
                    resolve();
                }
                else {
                    let num = 0;
                    do {
                        num = Math.floor(Math.random() * (100 - 0 + 1)) + 0;
                    } while(idList.includes(num));
                    // const userInfo = new MatchPacket(rows[0].id, rows[0].name, rows[0].curCart, roomID);
                    const userInfo = new MatchPacket(num, rows[0].name, rows[0].curCart, roomID);
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
            break;
        case 'matching':
            const matchList = matchRoomList.get(disconnectPlayer.room);
            matchList.splice(matchList.indexOf(socket.id), 1);
            if(matchList.length === 0)
            {
                matchRoomList.delete(disconnectPlayer.room);
            }
            break;
        case 'ready':
            const readyList = readyRoomList.get(disconnectPlayer.room);
            readyList.userList.splice(readyList.userList.indexOf(socket.id), 1);
            if(readyList.userList.length === 0)
            {
                readyRoomList.delete(disconnectPlayer.room);
            }
            break;
        case 'ingame':
            break;
    }
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