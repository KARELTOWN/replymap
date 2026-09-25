import { query } from "express-validator";

// Pagination parameters shared by every listing.

const positiveInt = (field, requiredKey) =>
  query(field)
    .notEmpty()
    .withMessage(requiredKey)
    .bail()
    .isInt({ gt: 0 })
    .withMessage("validation.positiveIntegerExpected");

const offset = () =>
  query("skip")
    .notEmpty()
    .withMessage("validation.skipRequired")
    .bail()
    .isInt({ min: 0 })
    .withMessage("validation.positiveIntegerExpected");

export const validatePaginationQuery = [
  positiveInt("page", "validation.pageRequired"),
  positiveInt("limit", "validation.limitRequired"),
];

export const validateLimitQuery = [positiveInt("limit", "validation.limitRequired")];

export const validateLimitSkipQuery = [positiveInt("limit", "validation.limitRequired"), offset()];

export const validateSkipQuery = [offset()];
