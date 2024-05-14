const m_Sockets = new Map;

function getSockets(){
    return Array.from(m_Sockets.values());
}

function getSocketById(id){
    return m_Sockets.get(id);
}

function addSocket(socket){
    m_Sockets.set(socket.clientID,socket);
}

function removeSocket(socket){
    m_Sockets.delete(socket.clientID);
}

module.exports = {
    getSockets,
    getSocketById,
    addSocket,
    removeSocket,
}