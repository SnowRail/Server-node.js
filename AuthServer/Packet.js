
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