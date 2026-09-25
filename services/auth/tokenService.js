import { AppError } from "../../shared/errors/appError.js";
import jwt from "jsonwebtoken";
import { redisClient } from "../../config/redis.js";

// Access token blacklist and rate limiting, backed by Redis.
//
// Refresh tokens are not handled here: they live in the database, where
// revoking one is an update (see authSessionService).

const ACCESS_PREFIX = "";
const RATE_PREFIX = "rate:";

// Remaining lifetime of a token, in seconds, so the revocation mark is only
// kept while the token could still be used.
const remainingLifetime = (payload) => {
  if (!payload?.exp) return 0;
  return Math.max(payload.exp - Math.floor(Date.now() / 1000), 0);
};

export const revokeAccessToken = async (token) => {
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const ttl = remainingLifetime(payload);
    if (ttl > 0) {
      await redisClient.set(`${ACCESS_PREFIX}${token}`, "blacklist", {
        EX: ttl,
        NX: true,
      });
    }
    return true;
  } catch (error) {
    // A token already expired or unreadable does not need revoking.
    return false;
  }
};

// Simple rate limiting (fixed-window counter) on Redis, with no extra
// dependency. Protects the authentication routes, which were open to password
// brute forcing.
export const rateLimit = ({ key, max, windowSeconds }) => {
  return async (req, res, next) => {
    try {
      const identifier =
        req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
      const redisKey = `${RATE_PREFIX}${key}:${identifier}`;

      const attempts = await redisClient.incr(redisKey);
      if (attempts === 1) {
        await redisClient.expire(redisKey, windowSeconds);
      }

      if (attempts > max) {
        const retryAfter = await redisClient.ttl(redisKey);
        res.set("Retry-After", String(Math.max(retryAfter, 1)));
        return next(new AppError("RATE_LIMITED"));
      }

      next();
    } catch (error) {
      // Redis being down must not make sign-in impossible: requests are let
      // through rather than blocking everyone.
      console.error("Rate limit unavailable:", error.message);
      next();
    }
  };
};
