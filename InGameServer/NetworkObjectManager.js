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

module.exports = {
    getObjects,
    addObject
};