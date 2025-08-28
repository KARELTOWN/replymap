import express from "express";
const FeedbackRouter = express.Router();
import feedbackController from "../../controllers/feedback/feedbackController.js";
import feedbackCommentController from "../../controllers/feedback/feedbackCommentController.js";
import feedbackHistoryController from "../../controllers/feedback/feedbackHistoryController.js";
import {
  validateFeedbackStore,
  validateFeedbackPerProject,
  validateShowFeedback,
  validateUpdateFeedback,
} from "../../validator/feedback/feedbackValidator.js";

import { validateCommentStore } from "../../validator/feedback/feedbackCommentValidator.js";

import multer from "multer";
import { validateSkipQuery } from "../../validator/generalValidator.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { uploadFile } from "../../services/files/multer.js";
const {
  getFeedbackParams,
  storeFeedback,
  getFeedbackPerProject,
  updateFeedback,
  showFeedback,
} = feedbackController();
const { getFeedbackComments, storeComment } = feedbackCommentController();

const { getFeedbackHistory } = feedbackHistoryController();

FeedbackRouter.get("/params", getFeedbackParams);
FeedbackRouter.post(
  "/store",
  uploadFile.fields([{ name: "file", maxCount: 1 }, { name: "attachments" }]),
  validateFeedbackStore,
  storeFeedback
);

FeedbackRouter.post(
  "/project",
  isauthentificate,
  blacklist,
  validateFeedbackPerProject,
  getFeedbackPerProject
);

FeedbackRouter.get(
  "/get/:feedback_id",
  isauthentificate,
  blacklist,
  validateShowFeedback,
  showFeedback
);

FeedbackRouter.put(
  "/update/:feedback_id",
  isauthentificate,
  blacklist,
  validateUpdateFeedback,
  updateFeedback
);

FeedbackRouter.get(
  "/get/:feedback_id/comments",
  isauthentificate,
  blacklist,
  validateSkipQuery,
  validateShowFeedback,
  getFeedbackComments
);

FeedbackRouter.post(
  "/comment/store",
  isauthentificate,
  blacklist,
  multer().any(),
  validateCommentStore,
  storeComment
);

FeedbackRouter.get(
  "/history/:feedback_id",
  isauthentificate,
  blacklist,
  validateShowFeedback,
  getFeedbackHistory
);

export default FeedbackRouter;
