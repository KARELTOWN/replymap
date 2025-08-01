import { body } from "express-validator";
import Project from "../../models/Project.js";

export const validateCreateInterceptError = [
  body("project")
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

  body("data")
    .notEmpty()
    .withMessage("Les données sont obligatoires")
    .custom(async (value) => {
      if (Array.isArray(value) && value.length > 0) {
        return true;
      } else {
        throw new Error("Données invalides");
      }
    }),
];
