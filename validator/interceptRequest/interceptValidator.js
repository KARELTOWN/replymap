import { body } from "express-validator";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";

export const validateCreateInterceptError = [
  body("data")
    .notEmpty()
    .withMessage("Les données sont obligatoires")
    .custom(async (value) => {
      if (Array.isArray(value) && value.length > 0) {
        for (const item of value) {
          if (
            !item.project ||
            !item.page_url ||
            !item.timeStamp ||
            !item.general ||
            !item.response
          ) {
            throw new Error("Erreur tracké invalide");
          }
        }
        return true;
      } else {
        throw new Error("Aucune donnée");
      }
    }),
];

export const validateShowSessionErrors = [
  body("session")
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
  body("project")
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
];
