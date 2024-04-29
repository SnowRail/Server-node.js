const NetworkObjectManager = require('./NetworkObjectManager');
const { ByteReader, ByteWriter } = require('../Network');
const { intSize, floatSize, vector2Size } = require('./typeSize');
const UnityInstance = require('./UnityClass/UnityInstance');
const SocketManager = require('./SoketManager');
const Protocol = require('./Protocol');
const { Vector2 } = require('./UnityClass');


function FirstConn(socket,id){
    
    const userList = NetworkObjectManager.getObjects();
    const userCount = userList.length;
    
    const myData = Buffer.alloc(intSize*2 + vector3Size);
    const bwmy = new ByteWriter(myData);
    bwmy.writeInt(Protocol.OtherPlayerConnect);
    bwmy.writeByte(id);
    broadcast(myData,socket);

    const sendData = Buffer.alloc((intSize*3) + (intSize+vector3Size)*userCount);
    const bw = new ByteWriter(sendData);
    bw.writeInt(Protocol.LoadGameScene);
    bw.writeInt(id);
    bw.writeInt(userCount);
    userList.forEach((element)=>{
        bw.writeInt(element.clientID);
        bw.writeVector3(element.position);
    });
    socket.write(sendData);

    const userInstance = new UnityInstance(id,new Vector3(0,0,0));
    NetworkObjectManager.addObject(userInstance);
}

function UpdatePlayerPos(socket,id, pos)
{
    const sendData = Buffer.alloc((intSize*2) + (floatSize*2));
    const bw = new ByteWriter(sendData);
    bw.writeInt(Protocol.PlayerMove);
    bw.writeInt(id);
    bw.writeVector2(pos);
    broadcast(sendData, socket);
    const userList = NetworkObjectManager.getObjects();
    userList.forEach((element)=>{
        if(element.clientID == id)
        {
            element.position = pos;  // break 사용할 수 있도록 변경하면 좋을듯
        }
    })
}

function PlayerDisconnect(socket, id){
    const buffer = Buffer.allocUnsafe(intSize*2);
    const bw = new ByteWriter(buffer);
    bw.writeInt(Protocol.PlayerDisconnect);
    bw.writeInt(id); 
    broadcast(buffer,socket);
    NetworkObjectManager.removeObjectByID(id);
}

function broadcast(message, sender) {
    const sockets = SocketManager.getSockets();

    sockets.forEach((socket) => {
        if (socket == sender) return;

        socket.write(message);
    });
}



module.exports = {
    FirstConn,
    broadcast,
    UpdatePlayerPos,
    DestroyPlayer: PlayerDisconnect
};