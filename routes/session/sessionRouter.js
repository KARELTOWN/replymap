import express from "express";
const SessionRouter = express.Router();
import {
  validateCreateSession,
  validateUpdateEndAt,
  validateShowSession,
} from "../../validator/session/sessionValidator.js";
import sessionController from "../../controllers/session/sessionController.js";
const {
  createSession,
  getSessionsByProjects,
  updateEndAt,
  showSession,
  getSessions,
} = sessionController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";

SessionRouter.post("/create", validateCreateSession, createSession);
SessionRouter.post("/end", validateUpdateEndAt, updateEndAt);
SessionRouter.get(
  "getByProject",
  isauthentificate,
  validatePaginationQuery,
  paginateData,
  getSessionsByProjects
);
SessionRouter.get(
  "/get",
  isauthentificate,
  validatePaginationQuery,
  paginateData,
  getSessions
);

SessionRouter.post("/show", isauthentificate, validateShowSession, showSession);
export default SessionRouter;
