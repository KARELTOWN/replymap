import { body, param } from "express-validator";
import moment from "moment";
import mongoose from "../../config/mongodb.js";
import {
  getFeedbackReferences,
  GUEST_AUTHOR_PREFIX,
} from "../../services/feedback/feedbackService.js";
import integrationService from "../../services/integration/integrationService.js";
const { integrationList } = integrationService();

// Project and feedback existence is no longer checked here: the
// requireProjectMember / requireFeedbackAccess middlewares already load them
// and also check project membership. Validating them twice doubled the Mongo
// round trips on every request.

const isKnownReference = (collection) => async (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("validation.invalidIdentifier");
  }
  const references = await getFeedbackReferences();
  const exists = references[collection].some(
    (item) => String(item._id) === String(value)
  );
  if (!exists) {
    throw new Error(
      collection === "types"
        ? "validation.unknownFeedbackType"
        : "validation.unknownFeedbackStatus"
    );
  }
  return true;
};

const optionalSessionId = body("session_id")
  .optional()
  .custom((value) => {
    // The widget sends "null" (as a string) when session recording is
    // disabled on the project.
    if (!value || value === "null") return true;
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("validation.invalidSessionId");
    }
    return true;
  });

// The author filter names either a member (an identifier) or a guest, who has
// no account: "guest:<email>" is then the only thing that identifies them.
const isAuthorFilter = (value) => {
  const text = String(value);
  if (text.startsWith(GUEST_AUTHOR_PREFIX)) {
    const email = text.slice(GUEST_AUTHOR_PREFIX.length);
    if (!email.includes("@")) throw new Error("validation.invalidEmail");
    return true;
  }
  if (!mongoose.Types.ObjectId.isValid(text)) throw new Error("validation.invalidUserId");
  return true;
};

export const validateFeedbackStore = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("validation.titleRequired")
    .isLength({ min: 3, max: 200 })
    .withMessage("validation.titleLength"),
  body("description").optional().isString(),
  body("user_agent")
    .notEmpty()
    .withMessage("validation.userAgentRequired"),
  body("width").notEmpty().withMessage("validation.screenWidthRequired"),
  body("height").notEmpty().withMessage("validation.screenHeightRequired"),
  body("type")
    .notEmpty()
    .withMessage("validation.feedbackTypeRequired")
    .custom(isKnownReference("types")),
  body("project_id").notEmpty().withMessage("validation.projectRequired"),
  optionalSessionId,

  body("integration")
    .optional()
    .isString()
    .custom((value) => {
      if (value && !integrationList.includes(value)) {
        throw new Error("validation.unknownIntegration");
      }
      return true;
    }),
  body("list_id").optional().isString(),

  body("url").optional().isString(),
  body("viewport_width").optional().isFloat(),
  body("viewport_height").optional().isFloat(),
  body("language").optional().isString(),
  body("timezone").optional().isString(),
  body("device_pixel_ratio").optional().isFloat(),
  body("referrer").optional().isString(),
];

// Routes whose only input is the path parameter. The access guard already
// rejects an unknown identifier, but the rule is that no value reaches a
// controller without a declared validation.
export const validateFeedbackIdParam = [
  param("feedback_id")
    .notEmpty()
    .withMessage("validation.feedbackRequired")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("validation.invalidFeedbackId");
      }
      return true;
    }),
];

// A day, or nothing. The board reads whole days, so the hour is never asked.
const optionalDate = (field) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) throw new Error("validation.invalidDate");
      return true;
    });

// Guest submission: the same shape as a member's, plus the identity the
// visitor typed. The email is what the team will answer to, so it is required.
export const validateGuestFeedbackStore = [
  ...validateFeedbackStore,
  body("guest_email")
    .trim()
    .notEmpty()
    .withMessage("validation.emailRequired")
    .bail()
    .isEmail()
    .withMessage("validation.invalidEmail")
    .normalizeEmail(),
  body("guest_name").optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 }),
];

export const validateFeedbackPerProject = [
  body("project_id").notEmpty().withMessage("validation.projectRequired"),
  body("limit").optional().isInt({ min: 1, max: 500 }),
  body("author")
    .optional({ nullable: true, checkFalsy: true })
    .custom(isAuthorFilter),
  optionalDate("start_date"),
  optionalDate("end_date"),
];

export const validateFeedbackAuthors = [
  body("project_id").notEmpty().withMessage("validation.projectRequired"),
];

export const validateUpdateFeedback = [
  param("feedback_id").notEmpty().withMessage("validation.feedbackRequired"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("validation.titleLength"),
  body("type").optional().custom(isKnownReference("types")),
  body("status").optional().custom(isKnownReference("statuses")),
  body("description")
    .optional()
    .isString()
    .withMessage("validation.stringExpected"),
];

export const validateSendFeedbackToIntegration = [
  param("feedback_id").notEmpty().withMessage("validation.feedbackRequired"),
  body("integration")
    .notEmpty()
    .withMessage("validation.integrationRequired")
    .custom((value) => {
      if (!integrationList.includes(value)) {
        throw new Error("validation.unknownIntegration");
      }
      return true;
    }),
  body("list_id").notEmpty().withMessage("validation.listRequired").isString(),
];

