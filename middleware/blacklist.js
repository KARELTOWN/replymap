import { ExtractJwt } from "passport-jwt";
import { redisClient } from "../config/redis.js";
import { AppError } from "../shared/errors/appError.js";

// Refuses an access token revoked at sign-out.
export const blacklist = async (req, res, next) => {
  try {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await redisClient.get(token))) return next(new AppError("AUTH_TOKEN_REVOKED"));
    return next();
  } catch (error) {
    return next(error);
  }
};
