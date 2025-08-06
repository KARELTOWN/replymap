import { matchedData, validationResult } from "express-validator";
import {
  redisDeleteAllkey,
  redisDeleteKey,
  redisDeleteMultipleKeys,
  redisGetKey,
  redisSetKey,
} from "../../config/redis.js";
import Session, { SessionModelFilter } from "../../models/Session.js";
import chunkService from "../../services/chunk/chunkService.js";
import Project from "../../models/Project.js";
import { isAdmin } from "../../utils/util.js";
import UserProject from "../../models/UserProject.js";
import moment from "moment";
const { getSessionChunks } = chunkService();

export default function projectController() {
  const createSession = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      let session = await Session.insertOne(data);
      const users_link_to_projects = await UserProject.find({
        project_id: data.project_id,
      })
        .select("user_id")
        .exec();
      let keys = [];
      for (const user of users_link_to_projects) {
        keys.push(`${user.user_id}_sessions_page_*`);
      }
      keys.push("all_sessions_page_*");
      await redisDeleteMultipleKeys(keys);
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
      let cached_job_sessions_by_project = await redisGetKey(cache_key);
      if (cached_job_sessions_by_project) {
        sessions = JSON.parse(cached_job_sessions_by_project);
      } else {
        total_sessions = await Session.count();
        sessions = await Session.find({ project_id: req.project_id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        await redisSetKey(cache_key, sessions);
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
      let data;
      let cache_key;
      let admin = isAdmin(req);
      if (admin) {
        cache_key = `all_sessions_page_${page}_limit_${limit}`;
      } else {
        cache_key = `${req.user._id}_sessions_page_${page}_limit_${limit}`;
      }
      let cached_job_sessions = await redisGetKey(cache_key);
      if (cached_job_sessions) {
        data = JSON.parse(cached_job_sessions);
      } else {
        const result = await SessionModelFilter(req, {}, skip, limit);
        const { total_session, session_list } = result;
        (data = {
          sessions: session_list,
          total: total_session,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total_session / limit),
        }),
          await redisSetKey(cache_key, data);
      }

      res.status(200).json({
        message: "Sessions récupérées",
        data: data,
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
    const { limit, skip } = req.query;
    try {
      let session;
      let events;
      // let cache_key = `session_${data.session_id}_data`;
      // let cache_key_events = `session_${data.session_id}_events`;

      // let cached_session = await redisGetKey(cache_key);
      // let cached_events = await redisGetKey(cache_key_events);

      // if (cached_session && cached_events) {
      //   session = JSON.parse(cached_session);
      //   events = JSON.parse(cached_events);
      // } else {
      session = await Session.findById(data.session_id).populate("user_id");
      events = await getSessionChunks(data.session_id, skip, limit);
      // }

      // await redisSetKey(cache_key, session, 180);
      // await redisSetKey(cache_key_events, events, 180);

      res.status(200).json({
        message: "Session récupérée",
        data: { session: session, events: events },
      });
    } catch (error) {
      next(error);
    }
  };

  const filterSessions = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);

      const { limit, skip, page } = req.pagination;
      let query = {};

      let start_date, end_date;
      if (data.start_date && data.end_date) {
        start_date = moment(data.start_date).toDate();
        end_date = moment(data.end_date).toDate();
        query.createdAt = { $gte: start_date, $lte: end_date };
      } else if (data.start_date && !data.end_date) {
        start_date = moment(data.start_date).toDate();
        query.createdAt = { $gte: start_date };
      } else if (!data.start_date && data.end_date) {
        end_date = moment(data.end_date).toDate();
        query.createdAt = { $lte: end_date };
      }

      if (data.project_id) {
        query.project_id = { $eq: data.project_id };
      }

      const result = await SessionModelFilter(req, query, skip, limit);
      const { total_session, session_list } = result;

      res.status(200).json({
        message: "Sessions filtrés",
        data: {
          sessions: session_list,
          total: total_session,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total_session / limit),
        },
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
    filterSessions,
  };
}
