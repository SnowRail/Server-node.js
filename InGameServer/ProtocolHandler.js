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
    
    const myData = Buffer.alloc(intSize*2 + vector2Size);
    const bwmy = new ByteWriter(myData);
    bwmy.writeInt(Protocol.s_NewUser);
    bwmy.writeByte(id);
    bwmy.writeVector2(new Vector2(0,0));
    broadcast(myData,socket);

    const sendData = Buffer.alloc((intSize*3) + (intSize+vector2Size)*userCount);
    const bw = new ByteWriter(sendData);
    bw.writeInt(Protocol.s_PlayerConnect);
    bw.writeInt(id);
    bw.writeInt(userCount);
    userList.forEach((element)=>{
        bw.writeInt(element.clientID);
        bw.writeVector2(element.position);
    })
    socket.write(sendData);

    const userInstance = new UnityInstance(userCount,new Vector2(0,0));
    NetworkObjectManager.addObject(userInstance);
}

function UpdatePlayerPos(socket,id, pos)
{
    const sendData = Buffer.alloc((intSize*2) + (floatSize*2));
    const bw = new ByteWriter(sendData);
    bw.writeInt(Protocol.s_PlayerPosition);
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
};