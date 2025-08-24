import express from "express";
const router = express.Router();
import AuthRouter from "./auth/AuthRouter.js";
import isauthentificate from "../middleware/isAuthentificate.js";
import ProjectRouter from "./project/projectRouter.js";
import NotificationRouter from "./notification/notificationRouter.js";
import chunkRouter from "./chunk/chunkRouter.js";
import SessionRouter from "./session/sessionRouter.js";
import { blacklist } from "../middleware/blacklist.js";
import eventRouter from "./event/eventRouter.js";
import statRouter from './stat/statRouter.js'
import FeedbackRouter from "./feedback/feedbackRouter.js";

router.use("/auth/", AuthRouter);
router.use("/project/", ProjectRouter);
router.use("/notification/", isauthentificate, blacklist, NotificationRouter);
router.use("/session/", SessionRouter);
router.use("/chunk/", chunkRouter);
router.use("/event/", eventRouter);
router.use("/stat/", statRouter);
router.use("/feedback/", FeedbackRouter);

export default router;
