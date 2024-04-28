const m_Sockets = [];

function getSockets(){
    return m_Sockets;
}

function addSocket(socket){
    m_Sockets.push(socket);
}

function removeSocket(socket){
    m_Sockets.splice(m_Sockets.indexOf(socket),1);
}

module.exports = {
    getSockets,
    addSocket,
    removeSocket,
}