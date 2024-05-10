const Protocol = require('./Protocol');

class Packet {
    constructor(protocol, id = -1) {
        this.type = protocol;
        this.from = id;
    }
}

class LoadGameScenePacket extends Packet {
    constructor(id, userCount, userList,) {
        super(Protocol.LoadGameScene, id);
        this.count = userCount;
        this.list = userList;
    }
}

class KeyPacket extends Packet {
    constructor(id, acc) {
        super(Protocol.Key, id);
        this.acceleration = acc;
    }
}

class SyncPositionPacket extends Packet {
    constructor(id, pos, vel, rot, timestamp) {
        super(Protocol.Sync, id);
        this.position = pos;
        this.velocity = vel;
        this.rotation = rot;
        this.timeStamp = timestamp
    }
}

class PlayerMovePacket extends Packet {
    constructor(playerPos, playerDirection, id) {
        super(Protocol.PlayerMove, id);
        this.position = playerPos;
        this.direction = playerDirection;
    }
}

class CountDownPacket extends Packet {
    constructor(protocol, count) {
        super(protocol);
        this.count = count;
    }
}


module.exports = {
    Packet,
    LoadGameScenePacket,
    KeyPacket,
    SyncPositionPacket,
    PlayerMovePacket,
    CountDownPacket
}