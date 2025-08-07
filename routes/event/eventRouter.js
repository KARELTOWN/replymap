import express from "express";
const eventRouter = express.Router();
import eventController from "../../controllers/event/eventController.js";
import { validateStoreEvent, editEventType } from "../../validator/event/eventValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { validateLimitQuery } from "../../validator/generalValidator.js";
import paginateData from "../../helpers/pagination.js";
const { createEvents, getIssues } = eventController();
eventRouter.post("/store", editEventType, validateStoreEvent, createEvents);

eventRouter.get(
  "/get",
  isauthentificate,
  blacklist,
  validateLimitQuery,
  paginateData,
  getIssues
);
export default eventRouter;
