import { query } from "express-validator";

export const validatePaginationQuery = [
  query("page")
    .notEmpty()
    .withMessage("La page est obligatoire")
    .isInt({ gt: 0 })
    .withMessage("La page doit être un entier"),
  query("limit")
    .notEmpty()
    .withMessage("La limite est obligatoire")
    .isInt({ gt: 0 })
    .withMessage("La limite doit être un entier"),
];


export const validateLimitQuery = [
  query("limit")
    .notEmpty()
    .withMessage("La limite est obligatoire")
    .isInt({ gt: 0 })
    .withMessage("La limite doit être un entier"),
];

export const validateLimitSkipQuery = [
  query("limit")
    .notEmpty()
    .withMessage("La limite est obligatoire")
    .isInt({ gt: 0 })
    .withMessage("La limite doit être un entier"),
  query("skip")
    .notEmpty()
    .withMessage("SKIP est obligatoire")
    .withMessage("SKIP doit être un entier"),
];


export const validateSkipQuery = [
  query("skip")
    .notEmpty()
    .withMessage("SKIP est obligatoire")
    .withMessage("SKIP doit être un entier"),
];