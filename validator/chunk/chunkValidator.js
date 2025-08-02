import { body } from "express-validator";
import Session from "../../models/Session.js";
import Project from "../../models/Project.js";
import validator from "validator";
export const validateStoreChunk = [
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
  body("events").custom(async (value) => {
    if (Array.isArray(value) && value.length > 0) {
      for (const event of value) {
        const session_exist = await Session.findById(event.session_id);
        if (!session_exist) {
          throw new Error(
            `La session avec l'ID ${event.session_id} n'existe pas.`
          );
        }

        if (!event.uniqueId || !validator.isUUID(event.uniqueId)) {
          throw new Error("Identifiant d'événement invalide.");
        }
      }
      return true;
    }
    throw new Error("Invalide events");
  }),
  // body("timestamp").notEmpty().withMessage("Timestamp obligatoire"),
];
