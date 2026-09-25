import express from "express";
import eventController from "../../controllers/event/eventController.js";
import { validateStoreEvent, validateEventFilter } from "../../validator/event/eventValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { validateLimitQuery, validatePaginationQuery } from "../../validator/generalValidator.js";
import paginateData from "../../helpers/pagination.js";
import { requireTrackedProject } from "../../middleware/trackedProject.js";
import { handle } from "../../middleware/errorHandler.js";

const eventRouter = express.Router();
const { createEvents, getIssues, filterIssues, getEventTypes } = eventController();

// Ingestion: active project, registered origin and capped volume.
eventRouter.post("/store", requireTrackedProject, validateStoreEvent, handle(createEvents));

eventRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validateLimitQuery,
  paginateData,
  handle(getIssues)
);

eventRouter.put(
  "/filter",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  validateEventFilter,
  handle(filterIssues)
);

eventRouter.get("/get-type", isauthentificate, blacklist, handle(getEventTypes));

export default eventRouter;
