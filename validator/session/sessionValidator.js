import { body, query } from "express-validator";
import User from "../../models/User.js";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";

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
    .optional()
    .custom(async (value) => {
      if (value) {
        let user_exist = await User.findById(value);
        if (!user_exist) {
          throw new Error("L'utilisateur spécifié n'existe pas.");
        }
        return true;
      }
    }),
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
  body("project_id")
    .notEmpty()
    .withMessage("Le libelle est obligatoire")
    .custom(async (value) => {
      if (value) {
        let project_exist = await Project.findById(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        return true;
      }
    }),
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
