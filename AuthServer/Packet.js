
class Packet {
    constructor(email) {
        this.email = email;
    }
}

class NamePacket extends Packet {
    constructor(email, name) {
        super(email);
        this.name = name;
    }
}

class MatchPacket extends Packet {
    constructor(email, name, curCart) {
        super(email);
        this.name = name;
        this.curCart = curCart;
    }
}