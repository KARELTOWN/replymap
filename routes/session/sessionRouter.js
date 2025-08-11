import express from "express";
const SessionRouter = express.Router();
import {
  validateCreateSession,
  validateUpdateEndAt,
  validateShowSession,
  validateFilterSession,
  validateShowSessionWithChunks,
} from "../../validator/session/sessionValidator.js";
import sessionController from "../../controllers/session/sessionController.js";
const {
  createSession,
  updateEndAt,
  showSession,
  getSessions,
  filterSessions,
  showSessionWithChunks
} = sessionController();
import paginateData from "../../helpers/pagination.js";
import {
  validateLimitSkipQuery,
  validatePaginationQuery,
} from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";

SessionRouter.post(
  "/create",
  validateCreateSession,
  createSession
);
SessionRouter.post("/end", validateUpdateEndAt, updateEndAt);

SessionRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  getSessions
);

SessionRouter.get(
  "/show/:session_id",
  validateShowSession,
  showSession
);

SessionRouter.post(
  "/show_with_chunks",
  isauthentificate,
  blacklist,
  validateLimitSkipQuery,
  validateShowSessionWithChunks,
  showSessionWithChunks
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
