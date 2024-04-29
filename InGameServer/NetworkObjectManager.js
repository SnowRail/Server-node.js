const UnityInstance = require('./UnityClass/UnityInstance');
let m_PlayerLists = [];

function getObjects(){
    return m_PlayerLists;
}

function addObject(uInstance){
    if(!(uInstance instanceof UnityInstance)){
        throw new Error('Only Unity Instance can be added.');
    }

    m_PlayerLists.push(uInstance);
}

function removeObject(uInstance){
    if(!(uInstance instanceof UnityInstance)){
        throw new Error('Only Unity Instance can be removed.');
    }
    m_PlayerLists.splice(m_PlayerLists.indexOf(uInstance),1);
}

function removeObjectByID(clientID){
    const newList = [];
    for(let i = 0; i<m_PlayerLists.length; ++i){
        const PlayerObject = m_PlayerLists[i];

        if(PlayerObject.clientID !== clientID){
            newList.push(PlayerObject);
        }
    }
    m_PlayerLists = newList;
}

module.exports = {
    getObjects,
    addObject,
    removeObject,
    removeObjectByID,
};