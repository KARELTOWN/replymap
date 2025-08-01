import express from "express";
const NotificationRouter = express.Router();
import notificationController from "../../controllers/notification/notificationController.js";
const { getNotifications } = notificationController();
import paginateData from "../../helpers/pagination.js";
import { validatePaginationQuery } from "../../validator/generalValidator.js";
NotificationRouter.get(
  "get",
  validatePaginationQuery,
  paginateData,
  getNotifications
);
export default NotificationRouter;
