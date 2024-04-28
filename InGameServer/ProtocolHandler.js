const NetworkObjectManager = require('./NetworkObjectManager');



function synchronizeNetworkObject(socket){
    const networkObjects = NetworkObjectManager.getObjects();
    const totalCount = networkObjects.length;
    let sendingBytes;

    if(socket.syncCount >= totalCount){
        
    }
}