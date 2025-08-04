import { matchedData, validationResult } from "express-validator";
import { redisClient, redisGetKey, redisSetKey } from "../../config/redis.js";
import {
  createInterceptRequestLog,
  displayInterceptRequestLogs,
} from "../../services/elasticLog.js";
import { isAdmin } from "../../utils/util.js";

export default function interceptController() {
  const getSessionInterceptErrors = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const limit = req.query.limit;
      const admin = isAdmin();
      let logs;
      let cache_key;
      if (admin) {
        cache_key = `project_${data.project}_session_${data.session}_logs_limit_${limit}`;
      } else {
        cache_key = `${req.user._id}_project_${data.project}_session_${data.session}_logs_limit_${limit}`;
      }
      let cached_logs = await redisGetKey(cache_key);
      if (cached_logs) {
        logs = JSON.parse(cached_logs);
      } else {
        logs = await displayInterceptRequestLogs(data, limit);
        if (logs) {
          redisSetKey(cache_key, logs, 180);
        }
      }

      res.status(200).json({
        message: "Logs récupérées",
        data: logs || [],
      });
    } catch (error) {
      next(error);
    }
  };

  const getErrors = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const limit = req.query.limit;
      const admin = isAdmin();
      let logs;
      let cache_key;
      if (admin) {
        cache_key = `errors_logs_limit_${limit}`;
      } else {
        cache_key = `${req.user._id}_errors_logs_limit_${limit}`;
      }
      let cached_logs = await redisGetKey(cache_key);
      if (cached_logs) {
        logs = JSON.parse(cached_logs);
      } else {
        logs = await displayInterceptRequestLogs(data, limit, "all");
        if (logs) {
          redisSetKey(cache_key, logs, 180);
        }
      }

      res.status(200).json({
        message: "Logs récupérées",
        data: logs || [],
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
      const response = await createInterceptRequestLog(data.data);
      if (response === true) {
        res.status(200).json({ message: "Logs enregistrés" });
      }
    } catch (error) {
      next(error);
    }
  };

  return {
    createIntercept,
    getSessionInterceptErrors,
    getErrors
  };
}
