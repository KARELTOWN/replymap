import { matchedData, validationResult } from "express-validator";
import { redisClient } from "../../config/redis.js";
import {
  createInterceptRequestLog,
  displayInterceptRequestLogs,
} from "../../services/elasticLog.js";

export default function interceptController() {
  const getInterceptErrors = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const limit = req.query.limit;

      let logs;
      cache_key = `project_${data.project}_session_${data.session}_logs_limit_${limit}`;
      let cached_logs = await redisClient.get(cache_key);
      if (cached_logs) {
        logs = JSON.parse(cached_logs);
      } else {
        logs = await displayInterceptRequestLogs(data, limit);
        await redisClient.set(cache_key, JSON.stringify(logs), {
          EX: process.env.REDIS_DEFAULT_CACHE_EXPIRATION || 3600,
        });
      }

      res.status(200).json({
        message: "Logs récupérées",
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  const createIntercept = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      await createInterceptRequestLog(data);
      res.status(200).json({ message: "Logs enregistrés" });
    } catch (error) {
      next(error);
    }
  };

  return {
    createIntercept,
    getInterceptErrors,
  };
}
