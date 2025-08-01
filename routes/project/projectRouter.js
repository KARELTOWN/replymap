import express from "express";
const ProjectRouter = express.Router();
import { validateProject, validateShowProject } from "../../validator/project/projectValidator.js";
import projectController from "../../controllers/project/projectController.js";
const { createProject, getProjects, showProject } = projectController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";

ProjectRouter.post("/create", validateProject, createProject);
ProjectRouter.get("/get", validatePaginationQuery, paginateData, getProjects);
ProjectRouter.get("/show/:id", validateShowProject, showProject);

export default ProjectRouter;
