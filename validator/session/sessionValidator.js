import { body, param } from "express-validator";
import moment from "moment";

// Shape of the session inputs. Existence and ownership are not checked here:
// the ingestion guard resolves the project, and the service refuses a session
// that does not belong to it. Checking existence in the validator doubled the
// database round trips on the widget's hottest path.

const optionalDate = (field) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) throw new Error("validation.invalidDate");
      return true;
    });

export const validateCreateSession = [
  body("project_id").isMongoId().withMessage("validation.invalidProjectId"),
  body("user_id").isUUID().withMessage("validation.invalidVisitorId"),
  body("first_visit").isBoolean().withMessage("validation.booleanExpected"),
  body("metadata").notEmpty().withMessage("validation.metadataRequired"),
  body("startedAt").notEmpty().withMessage("validation.startDateRequired"),
];

export const validateUpdateEndAt = [
  body("session_id").isMongoId().withMessage("validation.invalidSessionId"),
  body("endedAt").notEmpty().withMessage("validation.endDateRequired"),
];

export const validateShowSession = [
  param("session_id").isMongoId().withMessage("validation.invalidSessionId"),
];

export const validateShowSessionWithChunks = [
  body("session_id").isMongoId().withMessage("validation.invalidSessionId"),
];

export const validateFilterSession = [
  // The member whose feedback attributed the session, or the anonymous
  // identifier of the browser that recorded it.
  body("account")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("validation.invalidUserId"),
  body("visitor")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("validation.invalidVisitorId"),
  body("project_id")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("validation.invalidProjectId"),
  optionalDate("start_date"),
  optionalDate("end_date"),
];
