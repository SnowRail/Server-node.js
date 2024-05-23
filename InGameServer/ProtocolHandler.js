const NetworkObjectManager = require('./NetworkObjectManager');
const { intSize } = require('./typeSize');
const SocketManager = require('./SoketManager');
const Protocol = require('./Protocol');
const { 
    Packet, 
    KeyPacket,
    SyncPositionPacket, 
    CountDownPacket, 
    GameResultPacket
 } = require('./Packet');
const logger = require('./logger');
const sema = require('semaphore')(1);

const gameRoomList = new Map(); // {roomID, userList, startTime, goalCount, gameResult, state}

function AddGameRoomList(data)
{
    const roomData = JSON.parse(data);
    gameRoomList.set(roomData.roomID, {playerList : roomData.playerList, readycnt:0, startTime : 0, goalCount : 0, gameResult : new Map(), state : false});
}

function SetPlayerInfo(socket, jsonData)
{
    socket.clientID = jsonData.from;
    socket.roomID = jsonData.roomID;
    SocketManager.addSocket(socket);
    
    const json = new Packet(Protocol.GameSetUp, socket.roomID, jsonData.from);
    const dataBuffer = classToByte(json);
    if(socket)
    {
        socket.write(dataBuffer);
    }
}

function PlayerReady(jsonData)
{
    const room = gameRoomList.get(jsonData.roomID);
    sema.take(function(){
        room.readycnt++;
        sema.leave();
    });

    if(room.readycnt === room.playerList.length && room.state === false)
    {
        gameRoomList.get(jsonData.roomID).state = true;
        setTimeout(() => {
            CountDown(Protocol.GameStart, jsonData.roomID);
        }, 2000); // 2초(2000ms) 후에 실행
    }
    else if(!room.timeoutId)
    {
        const timeoutId = setTimeout(() => {
            if (!room.state) {
                gameRoomList.get(jsonData.roomID).state = true;
                CountDown(Protocol.GameStart, jsonData.roomID);
            }
        }, 20000); // 20초(20000ms) 후에 실행
        room.timeoutId = timeoutId; // 룸에 타임아웃 ID 저장
    }
}

function UpdatePlayerPos(socket, jsonData)
{
    const json = new SyncPositionPacket(jsonData.roomID, jsonData.from, jsonData.position, jsonData.velocity, jsonData.rotation, jsonData.timeStamp);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer, socket, jsonData.roomID);

    const userList = NetworkObjectManager.getObjects();
    userList.forEach((element)=>{
        if(element.clientID == jsonData.from)
        {
            element.position = jsonData.position;  // break 사용할 수 있도록 변경하면 좋을듯
            element.rotation = jsonData.rotation;
        }
    });
}
//
function CountDown(protocol, roomID) {
    let count;
    
    if(protocol === Protocol.GameStart)
    {
        count = 3; // 테스트를 위해 빠르게 끝냄
    }
    else if(protocol === Protocol.GameEnd)
    {
        count = 10;
    }

    const countDown = setInterval(() => {
        logger.info(count);
        let buffer;
        if(protocol === Protocol.GameStart)
        {
            buffer = classToByte(new CountDownPacket(Protocol.GameStartCountDown, roomID, count));
        }
        else if(protocol === Protocol.GameEnd)
        {
            buffer = classToByte(new CountDownPacket(Protocol.GameEndCountDown, roomID, count));
        }
        broadcastAll(buffer,roomID);

        if (count === 0) {
            clearInterval(countDown);
            logger.info("카운트다운 종료~");
            if(protocol === Protocol.GameStart)
            {
                const dataBuffer = classToByte(new Packet(protocol, roomID));
                broadcastAll(dataBuffer, roomID);
                gameRoomList.get(roomID).startTime = Date.now();
            }
            else if(protocol === Protocol.GameEnd)
            {
                const gameRoom = gameRoomList.get(roomID);
                const endTime = Date.now() - gameRoom.startTime;
                gameRoomList.get(roomID).state = false;
                const resultList = [];
                 gameRoom.gameResult.forEach((value, key) => {
                    resultList.push({nickname : key, rank : value.rank, goalTime : value.goalTime});
                });
                gameRoom.playerList.forEach(player => {
                    if (!gameRoom.gameResult.has(player)) {
                        resultList.push({nickname : player, rank : 0, goalTime : 0});
                    }
                });
                const dataBuffer = classToByte(new GameResultPacket(roomID, resultList, endTime));
                broadcastAll(dataBuffer, roomID);
            }
        }
        else{
            count--;
        }
    }, 1000);
}

function PlayerGoal(id, roomID){
    const gameRoom = gameRoomList.get(roomID);
    if(gameRoom !== undefined && gameRoom.state === true)
    {
        if (gameRoom.goalCount === 0) {
            CountDown(Protocol.GameEnd, roomID);
        }
        sema.take(function() {
            if (!gameRoom.gameResult.has(id)) { // 중복 goal 방지
                gameRoom.goalCount++;
                gameRoom.gameResult.set(id, {rank : gameRoom.goalCount, goalTime : Date.now() - gameRoom.startTime + 100 });
            }
            sema.leave();
        }); 
    }
}

function SendKeyValue(socket, jsonData){
    const json = new KeyPacket(jsonData.roomID, jsonData.from, jsonData.acceleration);
    const dataBuffer = classToByte(json);
    // broadcastAll(dataBuffer);
    broadcast(dataBuffer, socket, jsonData.roomID);
}

function broadcast(message, sender, roomID) {
    const playerList = gameRoomList.get(roomID).playerList;
    playerList.forEach(player => {
        const socket = SocketManager.getSocketById(player);
        if(sender == socket) return;
        if (socket) {
            socket.write(message);
        }
    });
}

function broadcastAll(message, roomID) {
    const playerList = gameRoomList.get(roomID).playerList;
    playerList.forEach(player => {
        const socket = SocketManager.getSocketById(player);
        if (socket) {
            socket.write(message);
        }
    });
}

function PlayerDisconnect(socket, id){
    console.log("clientID: ", socket.clientID, "roomid : ", socket.roomID, "id: ", id);
    const room = gameRoomList.get(socket.roomID);
    room.playerList.splice(room.playerList.indexOf(id),1);
    console.log("playerList after : ", room.playerList);
    NetworkObjectManager.removeObjectByID(id);

    const json = new Packet(Protocol.PlayerDisconnect, socket.roomID, id);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer, socket, socket.roomID);
}

function classToByte(json){
    const jsonString = JSON.stringify(json);
    const jsonLength = Buffer.byteLength(jsonString, 'utf8');
    const lengthBuffer = Buffer.alloc(intSize);
    lengthBuffer.writeUInt32LE(jsonLength, 0);

    const jsonBuffer = Buffer.from(jsonString,'utf8');
    const dataBuffer = Buffer.concat([lengthBuffer,jsonBuffer]);

    return dataBuffer;
}

module.exports = {
    AddGameRoomList,
    SetPlayerInfo,
    PlayerReady,
    UpdatePlayerPos,
    PlayerDisconnect,
    PlayerGoal,
    SendKeyValue,
};