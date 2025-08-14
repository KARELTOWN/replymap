import express from "express";
const eventRouter = express.Router();
import eventController from "../../controllers/event/eventController.js";
import { validateStoreEvent, editEventType, validateEventFilter } from "../../validator/event/eventValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { validateLimitQuery, validatePaginationQuery } from "../../validator/generalValidator.js";
import paginateData from "../../helpers/pagination.js";
const { createEvents, getIssues, filterIssues, getEventTypes } = eventController();
eventRouter.post("/store", editEventType, validateStoreEvent, createEvents);

eventRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validateLimitQuery,
  paginateData,
  getIssues
);

eventRouter.put(
  "/filter",
  isauthentificate,
  blacklist,
  validatePaginationQuery,
  paginateData,
  validateEventFilter,
  filterIssues
);

eventRouter.get(
  "/get-type",
  isauthentificate,
  blacklist,
  getEventTypes
)

export default eventRouter;
