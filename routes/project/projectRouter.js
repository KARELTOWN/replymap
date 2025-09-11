import express from "express";
const ProjectRouter = express.Router();
import {
  validateProject,
  validateShowProject,
  validateFilterProject,
  validateUpdateProject,
  validateInviteUser,
  validateQuitProject,
  validateProjectIDBody,
  validateProjectIDParam,
} from "../../validator/project/projectValidator.js";

import { validateUserEncrypt } from "../../validator/auth/authValidator.js";

import projectController from "../../controllers/project/projectController.js";
const {
  createProject,
  getProjects,
  showProject,
  filterProjects,
  updateProject,
  inviteUser,
  quitProject,
  projectMember,
  projectAllMembers,
} = projectController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";

ProjectRouter.post(
  "/create",
  isauthentificate,
  blacklist,
  validateProject,
  createProject
);
ProjectRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  getProjects
);

ProjectRouter.put(
  "/update/:project_id",
  isauthentificate,
  blacklist,
  validateUpdateProject,
  updateProject
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

ProjectRouter.get(
  "/member/:project_id",
  isauthentificate,
  blacklist,
  validateProjectIDParam,
  projectMember
);

ProjectRouter.post(
  "/invite_user",
  isauthentificate,
  blacklist,
  validateInviteUser,
  inviteUser
);

ProjectRouter.post(
  "/quit",
  isauthentificate,
  blacklist,
  validateQuitProject,
  quitProject
);

ProjectRouter.get(
  "/get_users/:project_id",
  isauthentificate,
  blacklist,
  validateProjectIDParam,
  projectAllMembers
);

ProjectRouter.get("/show/:id", validateShowProject, showProject);

export default ProjectRouter;
