const redis = require('ioredis');
const clientRedis = redis.createClient({
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost'
});

clientRedis.on("connect", function () {
  console.log("connected to Redis");
});

module.exports.clientRedis = clientRedis;