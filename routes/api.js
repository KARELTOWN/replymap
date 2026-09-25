import express from "express";
const router = express.Router();
import AuthRouter from "./auth/AuthRouter.js";
import isauthentificate from "../middleware/isAuthentificate.js";
import { allowWidgetSession } from "../middleware/widgetSession.js";
import ProjectRouter from "./project/projectRouter.js";
import NotificationRouter from "./notification/notificationRouter.js";
import chunkRouter from "./chunk/chunkRouter.js";
import SessionRouter from "./session/sessionRouter.js";
import { blacklist } from "../middleware/blacklist.js";
import eventRouter from "./event/eventRouter.js";
import statRouter from './stat/statRouter.js'
import FeedbackRouter from "./feedback/feedbackRouter.js";
import IntegrationRouter, {
  IntegrationWebhookRouter,
} from "./integration/integrationRouter.js";

router.use("/auth/", AuthRouter);
router.use("/project/", ProjectRouter);
router.use("/notification/", isauthentificate, blacklist, NotificationRouter);
router.use("/session/", SessionRouter);
router.use("/chunk/", chunkRouter);
router.use("/event/", eventRouter);
router.use("/stat/", statRouter);
router.use("/feedback/", FeedbackRouter);
// Must be mounted before the authenticated router: Trello cannot send a
// JWT when it calls the webhook.
router.use("/integration/", IntegrationWebhookRouter);
// The widget reads the lists of the board its project sends cards to. Declared
// before the mount, since authentication is applied to the whole router.
router.use("/integration/get_board_lists", allowWidgetSession);
router.use('/integration/', isauthentificate, blacklist, IntegrationRouter)

export default router;
