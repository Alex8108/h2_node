exports.getIsOverLimitInfo = async function (ip, keyPath, limitCount, expireSeconds, clientRedis) {
    let ObjForReturn = { "isOverLimit": false, "keyTTL": 0 };
    let key = "" + ip + "_" + keyPath;

    try {
        let incrResult = await clientRedis.incr(key);
        if (incrResult > limitCount) {
            ObjForReturn.keyTTL = await clientRedis.ttl(key);
            ObjForReturn.isOverLimit = true;
        }
    }
    catch (err) {
        // console.error('isOverLimit: could not increment key.');
        throw err;
    }

    if (ObjForReturn.isOverLimit === false) {
        clientRedis.expire(key, expireSeconds);
    }

    return ObjForReturn;
};