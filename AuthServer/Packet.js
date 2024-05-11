
class Packet {
    constructor(id) {
        this.id = id;
    }
}

class NamePacket extends Packet {
    constructor(id, name) {
        super(id);
        this.name = name;
    }
}

class MatchPacket extends Packet {
    constructor(id, name, curCart) {
        super(id);
        this.name = name;
        this.curCart = curCart;
    }
}