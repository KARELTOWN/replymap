import express from "express";
const SessionRouter = express.Router();
import {
  validateCreateSession,
  validateUpdateEndAt,
  validateShowSession,
  validateFilterSession
} from "../../validator/session/sessionValidator.js";
import sessionController from "../../controllers/session/sessionController.js";
const {
  createSession,
  getSessionsByProjects,
  updateEndAt,
  showSession,
  getSessions,
  filterSessions
} = sessionController();
import paginateData from "../../helpers/pagination.js";
import { validateChunkQuery, validatePaginationQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";

SessionRouter.post("/create", validateCreateSession, createSession);
SessionRouter.post("/end", validateUpdateEndAt, updateEndAt);
SessionRouter.get(
  "getByProject",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  getSessionsByProjects
);
SessionRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  getSessions
);

SessionRouter.post(
  "/show",
  isauthentificate,
  blacklist,
  validateChunkQuery,
  validateShowSession,
  showSession
);

SessionRouter.post(
  "/filter",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  validateFilterSession,
  filterSessions
);

export default SessionRouter;
