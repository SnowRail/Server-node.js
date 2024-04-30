const NetworkObjectManager = require('./NetworkObjectManager');
const { ByteReader, ByteWriter } = require('../Network');
const { intSize, floatSize, vector3Size, byteSize } = require('./typeSize');
const UnityInstance = require('./UnityClass/UnityInstance');
const SocketManager = require('./SoketManager');
const Protocol = require('./Protocol');
const { Vector3 } = require('./UnityClass');

let Goal = false;
let Start = false;


function FirstConn(socket,id){
    
    const userList = NetworkObjectManager.getObjects();
    const userCount = userList.length;
    
    const myData = Buffer.alloc(byteSize + intSize);
    const bwmy = new ByteWriter(myData);
    bwmy.writeByte(Protocol.OtherPlayerConnect);
    bwmy.writeInt(id);
    broadcast(myData,socket);

    const sendData = Buffer.alloc(byteSize + (intSize*2) + (intSize+vector3Size)*userCount);
    const bw = new ByteWriter(sendData);
    bw.writeByte(Protocol.LoadGameScene);
    bw.writeInt(id);
    bw.writeInt(userCount);
    userList.forEach((element)=>{
        bw.writeInt(element.clientID);
        bw.writeVector3(element.position);
    });
    socket.write(sendData);

    const userInstance = new UnityInstance(id, new Vector3(0,0,0));
    NetworkObjectManager.addObject(userInstance);
}

function UpdatePlayerPos(socket,id, pos)
{
    const sendData = Buffer.alloc(byteSize + intSize + vector3Size);
    const bw = new ByteWriter(sendData);
    bw.writeByte(Protocol.SyncPosition);
    bw.writeInt(id);
    bw.writeVector3(pos);
    broadcast(sendData, socket);
    const userList = NetworkObjectManager.getObjects();
    userList.forEach((element)=>{
        if(element.clientID == id)
        {
            element.position = pos;  // break 사용할 수 있도록 변경하면 좋을듯
        }
    });
}

function UpdatePlayerDirection(socket,id, direction)
{
    const sendData = Buffer.alloc(byteSize + intSize + vector3Size);
    const bw = new ByteWriter(sendData);
    bw.writeByte(Protocol.PlayerMove);
    bw.writeInt(id);
    bw.writeVector3(direction);
    broadcast(sendData, socket);
}

function PlayerDisconnect(socket, id){
    const buffer = Buffer.allocUnsafe(byteSize + intSize);
    const bw = new ByteWriter(buffer);
    bw.writeByte(Protocol.PlayerDisconnect);
    bw.writeInt(id); 
    broadcast(buffer,socket);
    NetworkObjectManager.removeObjectByID(id);
}

function CountDown(protocol) {
    let count;
    const buffer = Buffer.allocUnsafe(byteSize);
    const bw = new ByteWriter(buffer);
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

        if (count === 0) {
            clearInterval(countDown);
            console.log("카운트다운 종료~");
            if(protocol === Protocol.GameStart)
            {
                bw.writeByte(Protocol.GameStart);
                broadcastAll(buffer);
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
        const buffer = Buffer.allocUnsafe(byteSize);
        const bw = new ByteWriter(buffer);
        bw.writeByte(Protocol.GameStartCountDown);
        broadcastAll(buffer);
        Start = true;
        CountDown(protocol);
    }
}

function PlayerGoal(socket, id){
    if(Goal === false)
    {
        const buffer = Buffer.allocUnsafe(byteSize+intSize);
        const bw = new ByteWriter(buffer);
        bw.writeByte(Protocol.GameEnd);
        bw.writeInt(id);
        broadcastAll(buffer);
        Goal = true;
    }
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





module.exports = {
    FirstConn,
    UpdatePlayerPos,
    UpdatePlayerDirection,
    PlayerDisconnect,
    PlayerGoal,
    GameStartCountDown,
};