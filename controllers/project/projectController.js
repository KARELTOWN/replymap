import { matchedData, validationResult } from "express-validator";
import {
  redisDeleteAllkey,
  redisDeleteKey,
  redisDeleteMultipleKeys,
  redisGetKey,
  redisSetKey,
} from "../../config/redis.js";
import Project, { ProjectModelFilter } from "../../models/Project.js";
import crypto from "crypto";
import moment from "moment";
import UserProject, {
  user_connect_projects,
} from "../../models/UserProject.js";
import { isAdmin } from "../../utils/util.js";

export default function projectController() {
  const createProject = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const exist_link = await Project.exists({
        link: data.link,
        created_by: req.user._id,
      });
      if (exist_link) {
        res.status(403).json({ message: "Le lien existe déjà" });
      }
      data.tracking_id = crypto.randomUUID();
      let project = new Project({ ...data, created_by: req.user._id });
      await project.save();
      await UserProject.insertOne({
        user_id: req.user._id,
        project_id: project._id,
      });

      // await redisDeleteMultipleKeys([
      //   `${req.user._id}_projects_page_*`,
      //   `projects_page_*`,
      // ]);

      res.status(200).json({
        message: "Projet créé",
        data: {
          project: {
            libelle: project.libelle,
            link: project.link,
            active: project.active,
            createdAt: project.createdAt,
            tracking_code: project.tracking_code,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  const showProject = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      let project;
      // let cache_key = `project_${data.id}`;
      // let cached_project = await redisGetKey(cache_key);
      // if (cached_project) {
      //   project = JSON.parse(cached_project);
      // } else {
      project = await Project.findOne({ _id: data.id }).exec();
      // }
      if (!project) {
        res.status(403).json({ message: "Projet non trouvé" });
      } else {
        // redisSetKey(cache_key, project);
        res.status(200).json({
          message: "Projet récupéré",
          data: {
            libelle: project.libelle,
            link: project.link,
            active: project.active,
            active_recording: project.active_recording,
            active_track_errors: project.active_track_errors,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  };

  const getProjects = async (req, res, next) => {
    try {
      const { limit, skip, page } = req.pagination;
      let data;
      // let cache_key;
      // const admin = isAdmin(req);
      // if (admin) {
      //   cache_key = `projects_page_${page}_limit_${limit}`;
      // } else {
      //   cache_key = `${req.user._id}_projects_page_${page}_limit_${limit}`;
      // }
      // let cached_project_list = await redisGetKey(cache_key);
      // if (cached_project_list) {
      //   data = JSON.parse(cached_project_list);
      // } else {
        const result = await ProjectModelFilter(req, {}, skip, limit);
        const { total_project, project_list } = result;
        data = {
          projects: project_list,
          total: total_project,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total_project / limit),
        };
        // redisSetKey(cache_key, data);
      // }
      res.status(200).json({
        message: "Projets récupérées",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  };

  const filterProjects = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);

      const { limit, skip, page } = req.pagination;
      let search_libelle, search_link;
      let query = {};

      search_libelle = { libelle: { $regex: data.search, $options: "i" } };
      search_link = { link: { $regex: data.search, $options: "i" } };
      query.$or = [search_libelle, search_link];

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

      const result = await ProjectModelFilter(req, query, skip, limit);
      const { total_project, project_list } = result;

      res.status(200).json({
        message: "Projets filtrés",
        data: {
          projects: project_list,
          total: total_project,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total_project / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createProject,
    getProjects,
    showProject,
    filterProjects,
  };
}
