
class Packet {
    constructor(email, password, nickname) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
    }
}

class MatchPacket{
    constructor(nickname, roomID) {
        this.nickname = nickname;
        this.roomID = roomID;
    }
}


module.exports = {
    Packet,
    MatchPacket
}