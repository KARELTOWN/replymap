export let redisClient;
import redis from 'redis'
const redisConnection = async () => {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    }
  });
  redisClient.on("error", (error) => console.error(`Redis error : ${error}`));
  await redisClient.connect();
  console.log("Connexion à redis effectuée")
};

export default redisConnection;