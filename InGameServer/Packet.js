const Protocol = require('./Protocol');

class Packet {
    constructor(protocol,  roomID = 0, id = -1) {
        this.type = protocol;
        this.roomID = roomID;
        this.from = id;
    }
}

class KeyPacket extends Packet {
    constructor(roomID, id, acc) {
        super(Protocol.Key, roomID, id);
        this.acceleration = acc;
    }
}

class SyncPositionPacket extends Packet {
    constructor(roomID, id, pos, vel, rot, timestamp) {
        super(Protocol.Sync, roomID, id);
        this.position = pos;
        this.velocity = vel;
        this.rotation = rot;
        this.timeStamp = timestamp;
    }
}

class CountDownPacket extends Packet {
    constructor(protocol, roomID, count) {
        super(protocol, roomID);
        this.count = count;
    }
}

class GameResultPacket extends Packet {
    constructor(roomID, resultList, endTime) {
        super(Protocol.GameEnd, roomID);
        this.resultList = resultList;
        this.endTime = endTime;
    }
}

module.exports = {
    Packet,
    KeyPacket,
    SyncPositionPacket,
    CountDownPacket,
    GameResultPacket
}