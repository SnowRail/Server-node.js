const Offset = require('./Offset');
const {Vector2} = require('../InGameServer/UnityClass');
// const { Vector3, Quaternion } = require('');

class ByteReader extends Offset {
    readInt() {
        const value = this.data.readInt32LE(this.offset);
        this.offset += 4; // intSize

        return value;
    }

    readVector2(){
        const x = this.data.readFloatLE(this.offset + (4 * 0));
        const y = this.data.readFloatLE(this.offset + (4 * 1));
        this.offset += 4*2;

        return new Vector2(x,y);
    }

    readVector3(){
        const x = this.data.readFloatLE(this.offset + (4 * 0));
        const y = this.data.readFloatLE(this.offset + (4 * 1));
        const z = this.data.readFloatLE(this.offset + (4 * 2));
        this.offset += 4*3;

        return new Vector2(x,y);
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