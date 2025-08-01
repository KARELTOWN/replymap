import { matchedData, validationResult } from "express-validator";
import { redisClient } from "../../config/redis.js";
import Session from "../../models/Session.js";
import User from "../../models/User.js";
import eventService from "../../services/eventService.js";
import Project from "../../models/Project.js";
const { getSessionChunks } = eventService();

export default function projectController() {
  const createSession = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      let session = await Session.insertOne(data);

      res.status(200).json({
        message: "Session créé",
        data: { session_id: session._id },
      });
    } catch (error) {
      next(error);
    }
  };

  const updateEndAt = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      let session = await Session.findByIdAndUpdate(data.session_id, {
        endedAt: data.endedAt,
      });

      res.status(200).json({
        message: "Session modifiée",
        data: { session_id: session._id },
      });
    } catch (error) {
      next(error);
    }
  };

  const getSessionsByProjects = async (req, res, next) => {
    try {
      if (!req.project_id) {
        res.status(500).json({ message: "Invalid request" });
      }
      const { limit, skip, page } = req.pagination;
      let sessions;
      let total_sessions;
      cache_key = `project_${req.project_id}_sessions_page_${page}_limit_${limit}`;
      let cached_job_sessions_by_project = await redisClient.get(cache_key);
      if (cached_job_sessions_by_project) {
        sessions = JSON.parse(cached_job_sessions_by_project);
      } else {
        total_sessions = await Session.count();
        sessions = await Session.find({ project_id: req.project_id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        await redisClient.set(cache_key, JSON.stringify(sessions), {
          EX: process.env.REDIS_DEFAULT_CACHE_EXPIRATION || 3600,
        });
      }

      res.status(200).json({
        message: "Sessions récupérées",
        data: sessions,
        total: total_sessions,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total_sessions / limit),
      });
    } catch (error) {
      next(error);
    }
  };

  const getSessions = async (req, res, next) => {
    try {
      const { limit, skip, page } = req.pagination;
      let sessions;
      let total_sessions;
      let cache_key = `all_sessions_page_${page}_limit_${limit}`;
      let cached_job_sessions = await redisClient.get(cache_key);
      if (cached_job_sessions) {
        sessions = JSON.parse(cached_job_sessions);
      } else {
        total_sessions = await Session.count();
        sessions = await Session.find({})
          .populate({
            path: "project_id",
            model: Project,
            select: "_id libelle link",
          })
          .select(["_id", "project_id", "startedAt", "endedAt"])
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        await redisClient.set(cache_key, JSON.stringify(sessions), {
          EX: process.env.REDIS_DEFAULT_CACHE_EXPIRATION || 3600,
        });
      }

      res.status(200).json({
        message: "Sessions récupérées",
        data: {
          sessions: sessions,
          total: total_sessions,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total_sessions / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  const showSession = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);
    try {
      let session = await Session.findById(data.session_id).populate("user_id");
      const events = await getSessionChunks(data.session_id);
      console.log("session events", events);
      res.status(200).json({
        message: "Session récupérée",
        data: { session: session, events: events },
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createSession,
    updateEndAt,
    getSessionsByProjects,
    showSession,
    getSessions,
  };
}
