const Offset = require('./Offset');
const {Vector2, Vector3} = require('../InGameServer/UnityClass');
const { intSize, floatSize } = require('../InGameServer/typeSize');
// const { Vector3, Quaternion } = require('');

class ByteReader extends Offset {
    readInt() {
        const value = this.data.readInt32LE(this.offset);
        this.offset += intSize; // intSize

        return value;
    }

    readVector2(){
        const x = this.data.readFloatLE(this.offset + (floatSize * 0));
        const y = this.data.readFloatLE(this.offset + (floatSize * 1));
        this.offset += floatSize * 2;

        return new Vector2(x,y);
    }

    readVector3(){
        const x = this.data.readFloatLE(this.offset + (floatSize * 0));
        const y = this.data.readFloatLE(this.offset + (floatSize * 1));
        const z = this.data.readFloatLE(this.offset + (floatSize * 2));
        this.offset += floatSize * 3;

        return new Vector3(x,y,z);
    }

    readQuaternion(){
        const x = this.data.readFloatLE(this.offset + (floatSize * 0));
        const y = this.data.readFloatLE(this.offset + (floatSize * 1));
        const z = this.data.readFloatLE(this.offset + (floatSize * 2));
        const w = this.data.readFloatLE(this.offset + (floatSize * 3));
    }

    readByte() {
        const value = this.data[this.offset];
        this.offset++;

        return value;
    }

    readBytes(){
        const value = Buffer.from(this.data);
        const str = value.toString('utf8',1);
        return str;
    }
}

module.exports = ByteReader;