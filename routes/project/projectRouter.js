import express from "express";
const ProjectRouter = express.Router();
import {
  validateProject,
  validateShowProject,
} from "../../validator/project/projectValidator.js";
import projectController from "../../controllers/project/projectController.js";
const { createProject, getProjects, showProject } = projectController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";

ProjectRouter.post("/create", isauthentificate, validateProject, createProject);
ProjectRouter.get(
  "/get",
  isauthentificate,
  validatePaginationQuery,
  paginateData,
  getProjects
);
ProjectRouter.get("/show/:id", validateShowProject, showProject);

export default ProjectRouter;
