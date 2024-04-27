const Offset = require('./Offset');

class ByteWriter extends Offset {
    writeInt(value) {
        this.data.writeInt32LE(value, this.offset);
        this.offset += 4;
    }

    writeByte(value) {
        this.data[this.offset] = value;
        this.offset++;
    }
}

module.exports = ByteWriter;