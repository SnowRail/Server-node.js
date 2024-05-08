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

const connectedPlayers = new Map();
const matchingQueue = [];
const readyRoomList = new Map();
const gameRoomList = new Map();

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

    connection.query('SELECT * FROM User WHERE id = ? AND password = ?', [userData.id, userData.password], (err, rows) => {
        if (err) {
            console.error('Login query error:', err);
            socket.emit('loginFail', 'login fail');
            return;
        }

        if (rows.length === 0) {
            socket.emit('loginFail', '존재하지 않는 ID거나 비밀번호가 틀렸습니다');
        } else {
            socket.emit('loginSucc', `${rows[0].name}님 로그인에 성공했습니다.`);
            connectedPlayers.set(userData.id,{socket : socket, room : null});
        }
    });
}

function Signup(socket, msg) {
    const userData = JSON.parse(msg);
    
    connection.query('SELECT * FROM User WHERE id = ?', [userData.id], (err, rows) => {
        if (err) {
            console.error('Signup query error:', err);
            socket.emit('signupFail', 'signup fail');
            return;
        }

        if (rows.length === 0) {
            connection.query("INSERT INTO User (id, password, name) VALUES (?, ?, ?)", [userData.id, userData.password, userData.name], (err) => {
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

function MatchMaking(msg)
{
    const userData = JSON.parse(msg);
    if(readyRoomList.size === 0)
    {
        const roomID = makeRoomID();
        readyRoomList.set(roomID,[]);
    }
    const firstRoomID = readyRoomList.keys().next().value;
    console.log("firstRoomID : ",firstRoomID);
    const userList = readyRoomList.get(firstRoomID);
    console.log("userList : ",userList);

    userList.push(userData.id);
    console.log("userList : ",userList);
    const player = getPlayer(userData.id);
    player.socket.join(firstRoomID,(err)=>{
        if(err){
            player.socket.emit('enterRoomFail', 'Enter Room Fail!!');
            console.error('Enter Room Fail!! : ',err);
        }
        else{
            player.socket.emit('enterRoomSucc', 'Enter Room Succ!!');
            console.log('Enter Room Succ!! : ',err);
        }
    });
    if(userList.length === 2)
    {
        gameRoomList.set(firstRoomID,userList);
        readyRoomList.delete(firstRoomID);
    }
}

function getRandomPlayers(players,count)
{
    const shuffled = players.slice();
    let i = players.length;
    let temp, rand;
    while (i !== 0){
        rand = Math.floor(Math.random() * i);
        i -= 1;
        temp = shuffled[i];
        shuffled[i] = shuffled[rand];
        shuffled[rand] = temp;
    }
    return shuffled.slice(0,count);
}

function getPlayer(id){
    return connectedPlayers.get(id);
}


function makeRoomID(){
    let num = 0;
    do {
        num = Math.floor(Math.random() * (1000 - 0 + 1)) + 0;
    } while(gameRoomList.has(num)||readyRoomList.has(num));
    return num;
}



module.exports = {
    Login,
    Signup,
    MatchMaking
}