const NetworkObjectManager = require('./NetworkObjectManager');
const { ByteReader, ByteWriter } = require('../Network');
const { intSize, floatSize, vector3Size, byteSize } = require('./typeSize');
const UnityInstance = require('./UnityClass/UnityInstance');
const SocketManager = require('./SoketManager');
const Protocol = require('./Protocol');
const { 
    Packet, 
    KeyPacket,
    SyncPositionPacket, 
    PlayerMovePacket, 
    CountDownPacket, 
    LoadGameScenePacket } = require('./Packet');
const { Vector3 } = require('./UnityClass');

let Goal = false;
let Start = false;

function FirstConn(socket, id){ 
    // first 전송 - 아이디, otherplayerconnect
    const json1 = new Packet(Protocol.OtherPlayerConnect, id);
    const dataBuffer1 = classToByte(json1);

    broadcast(dataBuffer1, socket);
    

    // second 전송 - loadgamescene
    const userList = NetworkObjectManager.getObjects();
    const userCount = userList.length;

    let idList = [];

    userList.forEach((element)=>{
        idList.push(element.clientID);
    });

    const json2 = new LoadGameScenePacket(id, userCount, idList);
    const dataBuffer2 = classToByte(json2);

    socket.write(dataBuffer2);

    const userInstance = new UnityInstance(id, new Vector3(0,0,0), new Vector3(0,0,0));
    NetworkObjectManager.addObject(userInstance);
}

function UpdatePlayerPos(socket, jsonData)
{
    const json = new SyncPositionPacket(jsonData.from, jsonData.position, jsonData.direction);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer, socket);

    const userList = NetworkObjectManager.getObjects();
    userList.forEach((element)=>{
        if(element.clientID == id)
        {
            element.position = jsonData.position;  // break 사용할 수 있도록 변경하면 좋을듯
            element.rotation = jsonData.direction;
        }
    });
}

function PlayerBreak(socket, jsonData)
{
    const json = new Packet(Protocol.PlayerBreak, jsonData.from);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer, socket);
}

function UpdatePlayerDirection(socket, id, pos, direction)
{
    const json = new PlayerMovePacket(pos, direction , id);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer, socket);
}

function PlayerDisconnect(socket, id){

    const json = new Packet(Protocol.PlayerDisconnect,id);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer,socket);

    NetworkObjectManager.removeObjectByID(id);
}

function CountDown(protocol) {
    let count;
    
    const json = new Packet(protocol);
    const dataBuffer = classToByte(json);

    if(protocol === Protocol.GameStart)
    {
        count = 3; // 테스트를 위해 빠르게 끝냄
    }
    else if(protocol === Protocol.GameEnd)
    {
        count = 5;
    }
    const countDown = setInterval(() => {
        console.log(count);
        const buffer = classToByte(new CountDownPacket(Protocol.SendCountDown, count));
        broadcastAll(buffer);
        if (count === 0) {
            clearInterval(countDown);
            console.log("카운트다운 종료~");
            if(protocol === Protocol.GameStart)
            {
                broadcastAll(dataBuffer);
            }
            else if(protocol === Protocol.GameEnd)
            {
                // todo
            }
        }
        else{
            count--;
        }
    }, 1000);
}

function GameStartCountDown(protocol){
    if(Start === false)
    {
        const json = new Packet(protocol);
        const dataBuffer = classToByte(json);
        broadcastAll(dataBuffer);
        Start = true;
        CountDown(protocol);
    }
}

function PlayerGoal(jsonData){
    if(Goal === false)
    {
        const json = new Packet(Protocol.GameEnd, jsonData.from);
        const dataBuffer = classToByte(json);
        broadcastAll(dataBuffer);
        Goal = true;
    }
}

function SendKeyValue(socket, jsonData){
    const json = new KeyPacket(jsonData.from, jsonData.position, jsonData.velocity, jsonData.acceleration);
    const dataBuffer = classToByte(json);
    broadcast(dataBuffer, socket);
}

function ResetServer(){
    Goal = false;
    Start = false;
    console.log("ResetServer");
}

function broadcast(message, sender) {
    const sockets = SocketManager.getSockets();

    sockets.forEach((socket) => {
        if (socket == sender) return;

        socket.write(message);
    });
}

function broadcastAll(message) {
    const sockets = SocketManager.getSockets();

    sockets.forEach((socket) => {
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

    //console.log("bytedata : ", dataBuffer);
    return dataBuffer;
}

module.exports = {
    FirstConn,
    UpdatePlayerPos,
    PlayerBreak,
    UpdatePlayerDirection,
    PlayerDisconnect,
    PlayerGoal,
    CountDown,
    GameStartCountDown,
    ResetServer,
    SendKeyValue,
};