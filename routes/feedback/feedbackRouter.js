import express from "express";
import feedbackController from "../../controllers/feedback/feedbackController.js";
import {
  validateFeedbackIdParam,
  validateFeedbackStore,
  validateGuestFeedbackStore,
  validateFeedbackPerProject,
  validateFeedbackAuthors,
  validateUpdateFeedback,
  validateSendFeedbackToIntegration,
} from "../../validator/feedback/feedbackValidator.js";

import isauthentificate from "../../middleware/isAuthentificate.js";
import { allowWidgetSession } from "../../middleware/widgetSession.js";
import { blacklist } from "../../middleware/blacklist.js";
import { handle } from "../../middleware/errorHandler.js";
import { requireTrackedProject } from "../../middleware/trackedProject.js";
import { requireGuestFeedback } from "../../middleware/guestFeedback.js";
import { rateLimit } from "../../services/auth/tokenService.js";
import {
  requireProjectMember,
  requireProjectContributor,
  requireFeedbackAccess,
} from "../../middleware/projectAccess.js";
import { uploadFile } from "../../services/files/multer.js";

const FeedbackRouter = express.Router();

const {
  getFeedbackParams,
  storeFeedback,
  storeGuestFeedback,
  getFeedbackPerProject,
  getFeedbackAuthors,
  updateFeedback,
  sendFeedbackToIntegration,
  showFeedback,
  deleteFeedback,
  getFeedbackHistory,
} = feedbackController();

// Feedback from a visitor with no BugReveal account, on a project that opened
// itself to it. Declared before the authentication below, since there is none
// to do: the ingestion guard attributes the call to a project the way it does
// for recordings, `requireGuestFeedback` checks the project accepts guests, and
// a rate limit keeps the open door from becoming a mailbox for spam.
const guestLimiter = rateLimit({ key: "guest-feedback", max: 10, windowSeconds: 900 });
// Reading the form's reference data is cheap and happens on every page load
// that opens the widget: it gets its own, wider allowance.
const guestReadLimiter = rateLimit({ key: "guest-feedback-params", max: 60, windowSeconds: 900 });

// The types offered by the form, for a visitor with no account. The same
// reference data as `/params`, reached without a token because there is none
// to give. The project identifier is checked by the ingestion guard, which is
// what attributes the call to a project in the first place.
FeedbackRouter.post(
  "/guest/params",
  guestReadLimiter,
  requireTrackedProject,
  requireGuestFeedback,
  handle(getFeedbackParams)
);

FeedbackRouter.post(
  "/guest",
  guestLimiter,
  uploadFile.fields([{ name: "file", maxCount: 1 }, { name: "attachments" }]),
  requireTrackedProject,
  requireGuestFeedback,
  validateGuestFeedbackStore,
  handle(storeGuestFeedback)
);

// Every other route in this module requires an account: leaving or reading
// feedback means being identified and a member of the project concerned.
// Reference data and submission are the widget's two calls here.
FeedbackRouter.use(["/params", "/store"], allowWidgetSession);
FeedbackRouter.use(isauthentificate, blacklist);

// Feedback types and statuses: shared reference data, needed by the widget as
// soon as the form opens.
FeedbackRouter.get("/params", handle(getFeedbackParams));

// Submitting feedback requires strict project membership, with no exception
// for platform administrators: feedback must come from an invited member.
// multer runs first because project_id travels in the multipart body, which
// cannot be read before the file is parsed; the guard deletes the temporary
// files when access is denied.
FeedbackRouter.post(
  "/store",
  uploadFile.fields([{ name: "file", maxCount: 1 }, { name: "attachments" }]),
  requireProjectContributor,
  validateFeedbackStore,
  handle(storeFeedback)
);

FeedbackRouter.post(
  "/project",
  validateFeedbackPerProject,
  requireProjectMember,
  handle(getFeedbackPerProject)
);

// Members who wrote on this project: the choices of the author filter.
FeedbackRouter.post(
  "/authors",
  validateFeedbackAuthors,
  requireProjectMember,
  handle(getFeedbackAuthors)
);

FeedbackRouter.get(
  "/get/:feedback_id",
  validateFeedbackIdParam,
  requireFeedbackAccess,
  handle(showFeedback)
);

FeedbackRouter.put(
  "/update/:feedback_id",
  requireFeedbackAccess,
  validateUpdateFeedback,
  handle(updateFeedback)
);

FeedbackRouter.post(
  "/send_to_integration/:feedback_id",
  requireFeedbackAccess,
  validateSendFeedbackToIntegration,
  handle(sendFeedbackToIntegration)
);

FeedbackRouter.get(
  "/history/:feedback_id",
  validateFeedbackIdParam,
  requireFeedbackAccess,
  handle(getFeedbackHistory)
);

FeedbackRouter.delete(
  "/delete/:feedback_id",
  validateFeedbackIdParam,
  requireFeedbackAccess,
  handle(deleteFeedback)
);

export default FeedbackRouter;
