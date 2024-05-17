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

const gameRoomList = new Map(); // {roomID, userList, startTime, goalCount, gameResult}

function AddGameRoomList(data)
{
    const roomData = JSON.parse(data);
    gameRoomList.set(roomData.roomID, {playerList : roomData.playerList, readycnt:0, startTime : 0, goalCount : 0, gameResult : new Map()});
}

function SetPlayerInfo(socket, jsonData)
{
    socket.clientID = jsonData.from;
    socket.roomID = jsonData.roomID;
    SocketManager.addSocket(socket);
    const room = gameRoomList.get(socket.roomID);
    sema.take(function(){
        room.readycnt++;
        sema.leave();
    });
    const json2 = new Packet(Protocol.LoadGameScene, socket.roomID, jsonData.from);
    const dataBuffer2 = classToByte(json2);
    socket.write(dataBuffer2);

    
    if(room.readycnt === room.playerList.length)
    {
        CountDown(Protocol.GameStart, socket.roomID);
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

function PlayerDisconnect(socket, id){

    // const json = new Packet(Protocol.PlayerDisconnect, id);
    // const dataBuffer = classToByte(json);
    // broadcast(dataBuffer,socket);

    NetworkObjectManager.removeObjectByID(id);
}

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
                gameRoomList.get(roomID).startTime = Date.now();
                const dataBuffer = classToByte(new Packet(protocol, roomID));
                broadcastAll(dataBuffer, roomID);
            }
            else if(protocol === Protocol.GameEnd)
            {
                const gameRoom = gameRoomList.get(roomID);
                const endTime = Date.now() - gameRoom.startTime;
                const resultList = [];
                gameRoom.gameResult.forEach((value, key) => {
                    resultList.push({nickname : key, rank : value.rank, goalTime : value.goalTime});
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
    if(gameRoom !== undefined)
    {
        if (gameRoom.goalCount === 0) {
            CountDown(Protocol.GameEnd, roomID);
        }
        sema.take(function() {
            gameRoom.goalCount++;
            gameRoom.gameResult.set(id, {rank : gameRoom.goalCount, goalTime : Date.now() - gameRoom.startTime });
            console.log("goalID : " + id);
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
        socket.write(message);
    });
}

function broadcastAll(message, roomID) {
    const playerList = gameRoomList.get(roomID).playerList;
    playerList.forEach(player => {
        const socket = SocketManager.getSocketById(player);
        socket.write(message);
    });
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
    UpdatePlayerPos,
    PlayerDisconnect,
    PlayerGoal,
    SendKeyValue,
};