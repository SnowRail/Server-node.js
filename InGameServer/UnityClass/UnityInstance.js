class UnityInstance
{
    constructor(instanceType, clientID,localID,postion,rotation)
    {
        this.instanceType = instanceType;
        this.clientID = clientID;
        this.localID = localID;
        this.postion = postion;
        this.rotation = rotation;
    }
}

module.exports = UnityInstance;