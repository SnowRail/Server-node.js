function Offset(data, initOffset = 0) {
    this.data = data = data;
    this.offset = initOffset;
}

Offset.prototype.ResetOffset(() => {
    this.offset = 0;
})

Offset.prototype.MoveOffset((offset) => {
    this.offset = offset;
})

module.exports = Offset
