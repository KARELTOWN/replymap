import { body, param, query } from "express-validator";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";
import moment from "moment";
import validator from "validator";

export const validateCreateSession = [
  body("project_id")
    .notEmpty()
    .withMessage("Le projet est obligatoire")
    .custom(async (value) => {
      if (value) {
        let project_exist = await Project.findById(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        return true;
      }
    }),
  body("user_id")
    .notEmpty()
    .withMessage("Id utilisateur requis")
    .custom((value) => {
      if (!validator.isUUID(value)) {
        throw new Error("UUID attendu.");
      } else {
        return true;
      }
    }),
  body("first_visit")
    .notEmpty()
    .withMessage("Champ requis")
    .isBoolean()
    .withMessage("Booléen attendu"),

  body("metadata").notEmpty().withMessage("La métadonnée est obligatoire"),
  body("startedAt")
    .notEmpty()
    .withMessage("La date de début d'enregistrement est obligatoire"),
];

export const validateUpdateEndAt = [
  body("session_id")
    .notEmpty()
    .withMessage("La session est obligatoire")
    .custom(async (value) => {
      if (value) {
        let session_exist = await Session.findById(value);
        if (!session_exist) {
          throw new Error("La session n'existe pas");
        }
        return true;
      }
    }),
  body("endedAt")
    .notEmpty()
    .withMessage("La date de fin de session est obligatoire"),
];

export const validateShowSession = [
  param("session_id")
    .notEmpty()
    .withMessage("La session est obligatoire")
    .custom(async (value) => {
      if (value) {
        let session_exist = await Session.findById(value);
        if (!session_exist) {
          throw new Error("La session n'existe pas");
        }
        return true;
      }
    }),
];

export const validateShowSessionWithChunks = [
  body("session_id")
    .notEmpty()
    .withMessage("La session est obligatoire")
    .custom(async (value) => {
      if (value) {
        let session_exist = await Session.findById(value);
        if (!session_exist) {
          throw new Error("La session n'existe pas");
        }
        return true;
      }
    }),
];

export const validateFilterSession = [
  body("project_id")
    .optional()
    .custom(async (value) => {
      if (value) {
        let project_exist = await Project.findById(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        return true;
      }
    }),
  body("start_date").custom((value) => {
    if (value !== null && value !== "") {
      if (moment(value, "YYYY-MM-DD").isValid()) {
        return true;
      } else {
        throw new Error("Date invalide");
      }
    } else {
      return true;
    }
  }),
  ,
  body("end_date").custom((value) => {
    if (value !== null && value !== "") {
      if (moment(value, "YYYY-MM-DD").isValid()) {
        return true;
      } else {
        throw new Error("Date invalide");
      }
    } else {
      return true;
    }
  }),
];
