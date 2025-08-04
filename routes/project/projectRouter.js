import express from "express";
const ProjectRouter = express.Router();
import {
  validateProject,
  validateShowProject,
  validateFilterProject
} from "../../validator/project/projectValidator.js";
import projectController from "../../controllers/project/projectController.js";
const { createProject, getProjects, showProject, filterProjects } = projectController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";

ProjectRouter.post("/create", isauthentificate, blacklist, validateProject, createProject);
ProjectRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  getProjects
);

ProjectRouter.post(
  "/filter",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  validateFilterProject,
  filterProjects
);

ProjectRouter.get("/show/:id", validateShowProject, showProject);

export default ProjectRouter;
