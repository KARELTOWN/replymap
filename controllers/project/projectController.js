import { matchedData, validationResult } from "express-validator";
// import mailing, { mailToAdmin } from "../../config/mailer";
import { redisClient } from "../../config/redis.js";
import Project from "../../models/Project.js";
import projectService from "../../services/projectService.js";
const { getProjectScript } = projectService();
import crypto from "crypto";

export default function projectController() {
  const createProject = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const exist_link = await Project.exists({ link: data.link });
      if (exist_link) {
        res.status(403).json({ message: "Le lien existe déjà" });
      }
      console.log("dfdvdvvb", req);
      data.tracking_id = crypto.randomUUID();
      let project = new Project({ ...data, user_id: req.user._id });
      await project.save();

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
      let cache_key = `project_${data.project_id}`;
      let cached_project = await redisClient.get(cache_key);
      if (cached_project) {
        project = JSON.parse(cached_project);
      } else {
        project = await Project.find({ _id: data.project_id }).exec();
      }
      if (!project) {
        res.status(404).json({ message: "Projet non trouvé" });
      }
      res.status(200).json({
        message: "Projet récupéré",
        data: {
          libelle: project.libelle,
          link: project.link,
          active: project.active,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  const getProjects = async (req, res, next) => {
    try {
      const { limit, skip, page } = req.pagination;
      let project;
      let total_project;
      let cache_key = `projects_page_${page}_limit_${limit}`;
      let cached_job_offers = await redisClient.get(cache_key);
      if (cached_job_offers) {
        project = JSON.parse(cached_job_offers);
      } else {
        total_project = await Project.count();
        project = await Project.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec();
        await redisClient.set(cache_key, JSON.stringify(project), {
          EX: process.env.REDIS_DEFAULT_CACHE_EXPIRATION || 3600,
        });
      }

      res.status(200).json({
        message: "Projets récupérées",
        data: {
          projects: project,
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
  };
}
