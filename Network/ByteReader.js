const Offset = require('./Offset');
// const { Vector3, Quaternion } = require('');

class ByteReader extends Offset {
    readInt() {
        const value = this.data.readInt32LE(this.offset);
        this.offset += 4; // intSize

        return value;
    }

    readByte() {
        const value = this.data[this.offset];
        this.offset++;

        return value;
    }
}

module.exports = ByteReader;