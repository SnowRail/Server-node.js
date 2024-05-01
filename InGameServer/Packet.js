const Protocol = require('./Protocol');

class Packet {
    constructor(protocol, id = -1) {
        this.type = protocol;
        this.id = id;
    }
}

class LoadGameScenePacket extends Packet {
    constructor(id, userCount, userList, ishost) {
        super(Protocol.LoadGameScene, id);
        this.count = userCount;
        this.list = userList;
        this.ishost = ishost;
    }
}

class SyncPositionPacket extends Packet {
    constructor(id, playerPos, playerRot) {
        super(Protocol.SyncPosition, id);
        this.position = playerPos;
        this.rotate = playerRot;
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
    constructor(protocol) {
        super(protocol);
        this.count = 3;
    }
}   

module.exports = {
    Packet,
    LoadGameScenePacket,
    SyncPositionPacket,
    PlayerMovePacket,
    CountDownPacket
}