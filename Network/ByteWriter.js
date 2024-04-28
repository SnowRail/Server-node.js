const { intSize, floatSize } = require('../InGameServer/typeSize');
const Offset = require('./Offset');

class ByteWriter extends Offset {
    writeInt(value) {
        this.data.writeInt32LE(value, this.offset);
        this.offset += intSize;
    }

    writeVector2(value){
        this.data.writeFloatLE(value.x, this.offset + (floatSize * 0));
        this.data.writeFloatLE(value.y, this.offset + (floatSize * 1));
        this.offset += floatSize * 2;
    }

    writeVector3(value){
        this.data.writeFloatLE(value.x, this.offset + (floatSize * 0));
        this.data.writeFloatLE(value.y, this.offset + (floatSize * 1));
        this.data.writeFloatLE(value.z, this.offset + (floatSize * 2));
        this.offset += floatSize * 3;
    }

    writeQuaternion(value){
        this.data.writeFloatLE(value.x, this.offset + (floatSize * 0));
        this.data.writeFloatLE(value.y, this.offset + (floatSize * 1));
        this.data.writeFloatLE(value.z, this.offset + (floatSize * 2));
        this.data.writeFloatLE(value.w, this.offset + (floatSize * 3));
        this.offset += floatSize * 4;
    }

    writeByte(value) {
        this.data[this.offset] = value;
        this.offset++;
    }
}

module.exports = ByteWriter;