import express from "express";
import {
  validateCreateSession,
  validateUpdateEndAt,
  validateShowSession,
  validateFilterSession,
  validateShowSessionWithChunks,
} from "../../validator/session/sessionValidator.js";
import sessionController from "../../controllers/session/sessionController.js";
import paginateData from "../../helpers/pagination.js";
import {
  validateLimitSkipQuery,
  validatePaginationQuery,
} from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { requireTrackedProject } from "../../middleware/trackedProject.js";
import { handle } from "../../middleware/errorHandler.js";

const SessionRouter = express.Router();

const {
  createSession,
  updateEndAt,
  showSession,
  showSessionFlow,
  getSessions,
  filterSessions,
  getSessionVisitors,
  showSessionWithChunks,
} = sessionController();

// Ingestion: no account possible (anonymous visitor on the customer's site),
// but active project, registered origin and capped volume.
SessionRouter.post("/create", requireTrackedProject, validateCreateSession, handle(createSession));
SessionRouter.post("/end", requireTrackedProject, validateUpdateEndAt, handle(updateEndAt));

// Public, used by the widget to resume an open session. Answers only the
// start and end dates.
SessionRouter.get("/show/:session_id", validateShowSession, handle(showSession));

// The path of a session. Requires access to the session's project, like the
// replay: it says which pages a named visitor went through.
SessionRouter.get(
  "/flow/:session_id",
  isauthentificate,
  blacklist,
  validateShowSession,
  handle(showSessionFlow)
);

SessionRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  handle(getSessions)
);

// Replay: requires access to the session's project (checked in the service).
SessionRouter.post(
  "/show_with_chunks",
  isauthentificate,
  blacklist,
  validateLimitSkipQuery,
  validateShowSessionWithChunks,
  handle(showSessionWithChunks)
);

// Choices of the "person" filter: the members whose feedback attributed a
// session on the projects the caller may read. It takes no input.
SessionRouter.get("/visitors", isauthentificate, blacklist, handle(getSessionVisitors));

SessionRouter.post(
  "/filter",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  validateFilterSession,
  handle(filterSessions)
);

export default SessionRouter;
