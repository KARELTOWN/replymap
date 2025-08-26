export let redisClient;
import { configDotenv } from "dotenv";
import redis from "redis";
configDotenv();

const redisConnection = async () => {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || "redis_dev",
      port: process.env.REDIS_PORT || 6379,
    },
  });
  redisClient.on("error", (error) => console.error(`Redis error : ${error}`));
  await redisClient.connect();
  console.log("Connexion à redis effectuée");
};

export const redisGetKey = (key) => {
  return redisClient.get(key);
};

export const redisSetKey = async (key, data, expire) => {
  const expiration =
    expire !== undefined
      ? expire
      : Number(process.env.REDIS_DEFAULT_CACHE_EXPIRATION) || 3600;
  return await redisClient.set(key, JSON.stringify(data), {
    EX: expiration,
  });
};

export const redisDeleteKey = async (key) => {
  return await redisClient.del(key);
};

export const redisDeleteMultipleKeys = async (keys) => {
  if (Array.isArray(keys) && keys.length === 0) {
    return;
  }
  for (const key of keys) {
    const keys = await redisClient.keys(key);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
};

export const redisDeleteAllkey = async (key) => {
  const keys = await redisClient.keys(key);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
export default redisConnection;
