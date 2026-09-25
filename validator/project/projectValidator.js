import { body, param } from "express-validator";
import moment from "moment";

// Shape of the project inputs. Existence, ownership and uniqueness are rules of
// projectService: a validator only says whether the request is well formed.

const optionalDate = (field) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) throw new Error("validation.invalidDate");
      return true;
    });

const projectIdIn = (location) =>
  location("project_id")
    .notEmpty()
    .withMessage("validation.projectRequired")
    .bail()
    .isMongoId()
    .withMessage("validation.invalidProjectId");

export const validateProject = [
  body("libelle").trim().notEmpty().withMessage("validation.nameRequired"),
  body("link").trim().notEmpty().withMessage("validation.linkRequired"),
];

export const validateShowProject = [
  param("id").isMongoId().withMessage("validation.invalidProjectId"),
];

export const validateUpdateProject = [
  projectIdIn(param),
  body("link").optional().trim().notEmpty().withMessage("validation.linkRequired"),
  body("libelle").optional().trim().notEmpty().withMessage("validation.nameRequired"),
  body("track").optional().isObject().withMessage("validation.objectExpected"),
  body("allow_guest_feedback")
    .optional()
    .isBoolean()
    .withMessage("validation.booleanExpected")
    .toBoolean(),
];

export const validateFilterProject = [
  body("search")
    .optional({ nullable: true })
    .isString()
    .withMessage("validation.stringExpected")
    .trim(),
  optionalDate("start_date"),
  optionalDate("end_date"),
];

export const validateInviteUser = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("validation.emailRequired")
    .bail()
    .isEmail()
    .withMessage("validation.invalidEmail"),
  projectIdIn(body),
];

// Switching one detected website off, or back on.
export const validateInstalledHost = [
  projectIdIn(param),
  body("host")
    .trim()
    .notEmpty()
    .withMessage("validation.hostRequired")
    .isLength({ max: 255 })
    .withMessage("validation.hostRequired"),
  body("blocked")
    .exists()
    .withMessage("validation.booleanExpected")
    .bail()
    .isBoolean()
    .withMessage("validation.booleanExpected")
    .toBoolean(),
];

export const validateProjectIDBody = [projectIdIn(body)];

export const validateProjectIDParam = [projectIdIn(param)];

export const validateQuitProject = [
  projectIdIn(body),
  body("user_id")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("validation.invalidUserId"),
];
