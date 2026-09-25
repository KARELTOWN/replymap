import express from "express";
import notificationController from "../../controllers/notification/notificationController.js";
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
import { handle } from "../../middleware/errorHandler.js";

const NotificationRouter = express.Router();
const { getNotifications } = notificationController();

// The path lacked its leading slash ("get"), which Express 5 does not match
// against "/get": the route was unreachable.
NotificationRouter.get("/get", validatePaginationQuery, paginateData, handle(getNotifications));

export default NotificationRouter;
