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
  validateInstalledHost,
} from "../../validator/project/projectValidator.js";

import projectController from "../../controllers/project/projectController.js";
const {
  createProject,
  getProjects,
  showProject,
  getInstallation,
  testInstallation,
  updateInstalledHost,
  filterProjects,
  updateProject,
  inviteUser,
  quitProject,
  projectMember,
  projectAllMembers,
  projectMembership,
} = projectController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { requireProjectMember } from "../../middleware/projectAccess.js";
import { allowWidgetSession, requireWidgetProjectMatch } from "../../middleware/widgetSession.js";
import { handle } from "../../middleware/errorHandler.js";
import { rateLimit } from "../../services/auth/tokenService.js";

// Each check makes the server fetch a page: a button one can click is also a
// button one can hold down.
const installationTestLimiter = rateLimit({
  key: "installation-test",
  max: 10,
  windowSeconds: 300,
});

ProjectRouter.post(
  "/create",
  isauthentificate,
  blacklist,
  validateProject,
  handle(createProject)
);
ProjectRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  handle(getProjects)
);

ProjectRouter.put(
  "/update/:project_id",
  isauthentificate,
  blacklist,
  validateUpdateProject,
  handle(updateProject)
);

ProjectRouter.post(
  "/filter",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  validateFilterProject,
  handle(filterProjects)
);

ProjectRouter.get(
  "/member/:project_id",
  isauthentificate,
  blacklist,
  validateProjectIDParam,
  requireProjectMember,
  handle(projectMember)
);

ProjectRouter.post(
  "/invite_user",
  isauthentificate,
  blacklist,
  validateInviteUser,
  handle(inviteUser)
);

ProjectRouter.post(
  "/quit",
  isauthentificate,
  blacklist,
  validateQuitProject,
  handle(quitProject)
);

ProjectRouter.get(
  "/get_users/:project_id",
  isauthentificate,
  blacklist,
  validateProjectIDParam,
  requireProjectMember,
  handle(projectAllMembers)
);

// Yes/no answer to "may this account leave feedback on this project?",
// queried by the embedded widget: deliberately outside requireProjectMember,
// since the expected answer can be "no".
ProjectRouter.get(
  "/membership/:project_id",
  allowWidgetSession,
  isauthentificate,
  requireWidgetProjectMatch,
  blacklist,
  validateProjectIDParam,
  handle(projectMembership)
);

// State of the installation, and the check run on demand from the project
// sheet. Both are reserved to the members of the project: the second makes the
// server fetch a page, which is not something an outsider gets to trigger.
ProjectRouter.get(
  "/installation/:project_id",
  isauthentificate,
  blacklist,
  validateProjectIDParam,
  requireProjectMember,
  handle(getInstallation)
);

ProjectRouter.post(
  "/installation/test/:project_id",
  isauthentificate,
  blacklist,
  installationTestLimiter,
  validateProjectIDParam,
  requireProjectMember,
  handle(testInstallation)
);

// Switching a detected website off. The ownership check lives in the service,
// as for the project's other settings.
ProjectRouter.patch(
  "/installation/host/:project_id",
  isauthentificate,
  blacklist,
  validateInstalledHost,
  requireProjectMember,
  handle(updateInstalledHost)
);

ProjectRouter.get("/show/:id", validateShowProject, handle(showProject));

export default ProjectRouter;
