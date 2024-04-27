function Offset(data, initOffset = 0) {
    this.data = data = data;
    this.offset = initOffset;
}


Offset.prototype.ResetOffset = function() {
    this.offset = 0;
}

Offset.prototype.MoveOffset = function(offset) {
    this.offset = offset;
}

module.exports = Offset
