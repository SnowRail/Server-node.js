class Packet {
    constructor(protocol, id = -1) {
        this.protocol = protocol;
        this.id = id;
    }
}

class SyncPositionPacket extends Packet {
    constructor(playerPos, playerRot) {
        super(Protocol.SyncPosition);
        this.position = playerPos;
        this.rotate = playerRot;
    }
}

class PlayerMovePacket extends Packet {
    constructor(playerDirection, id) {
        super(Protocol.PlayerMove, id);
        this.direction = playerDirection;
    }
}

class CountDownPacket extends Packet {
    constructor(protocol) {
        super(protocol);
        this.count = 3;
    }
}   
