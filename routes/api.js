import express from "express";
const router = express.Router();
import AuthRouter from "./auth/AuthRouter.js";
import isauthentificate from "../middleware/isAuthentificate.js";
import ProjectRouter from "./project/projectRouter.js";
import NotificationRouter from "./notification/notificationRouter.js";
import chunkRouter from "./chunk/chunkRouter.js";
import SessionRouter from "./session/sessionRouter.js";
import { validateCreateInterceptError, validateShowSessionErrors } from "../validator/interceptRequest/interceptValidator.js";
import interceptController from "../controllers/interceptRequest/interceptController.js";
import { validateLimitQuery } from "../validator/generalValidator.js";
import { blacklist } from "../middleware/blacklist.js";
import eventRouter from "./event/eventRouter.js";
const { createIntercept, getSessionInterceptErrors, getErrors } = interceptController();

router.use("/auth/", AuthRouter);
router.use("/project/", ProjectRouter);
router.use("/notification/", isauthentificate, blacklist, NotificationRouter);
router.use("/session/", SessionRouter);
router.use("/chunk/", chunkRouter);
router.use("/events/", eventRouter);

// Intercept Error routes
router.post(
  "/intercept_error",
  validateCreateInterceptError,
  createIntercept
);
router.put(
  "/get_session_errors",
  isauthentificate,
  blacklist,
  validateLimitQuery,
  validateShowSessionErrors,
  getSessionInterceptErrors
);

router.get(
  "/get_errors",
  isauthentificate,
  blacklist,
  validateLimitQuery,
  getErrors
);

export default router;
