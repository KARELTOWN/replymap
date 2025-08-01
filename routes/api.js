import express from "express";
const router = express.Router();
import AuthRouter from "./auth/AuthRouter.js";
import isauthentificate from "../middleware/isAuthentificate.js";
import ProjectRouter from "./project/projectRouter.js";
import NotificationRouter from "./notification/notificationRouter.js";
import chunkRouter from "./chunk/chunkRouter.js";
import SessionRouter from "./session/sessionRouter.js";
import { validateCreateInterceptError } from "../validator/interceptRequest/interceptValidator.js";
import interceptController from "../controllers/interceptRequest/interceptController.js";
import { validateLimitQuery } from "../validator/generalValidator.js";
const { createIntercept, getInterceptErrors } = interceptController();

router.use("/auth/", AuthRouter);
router.use("/project/", isauthentificate, ProjectRouter);
router.use("/notification/", isauthentificate, NotificationRouter);
router.use("/session/", SessionRouter);
router.use("/chunk/", chunkRouter);

// Intercept Error routes
router.post(
  "/intercept_error",
  validateCreateInterceptError,
  createIntercept
);
router.post(
  "/get_intercept_errors",
  isauthentificate,
  validateLimitQuery,
  validateCreateInterceptError,
  getInterceptErrors
);

export default router;
