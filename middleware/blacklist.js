import { ExtractJwt } from "passport-jwt";
import { redisClient } from "../config/redis.js";

export const blacklist = async (req, res, next) => {
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  const blacklist = await redisClient.get(token);
  if (blacklist) {
    res.status(403).json({ message: "Token invalide" });
  }
  next();
};
