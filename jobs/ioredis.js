import { configDotenv } from "dotenv";
configDotenv();
import IORedis from "ioredis";
export const connectionRedis = new IORedis({
  host: process.env.REDIS_HOST || "redis_dev",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

connectionRedis.on("connect", () => console.log("✅ Connexion Redis établie"));
connectionRedis.on("error", (err) => console.error("❌ Redis error:", err));
