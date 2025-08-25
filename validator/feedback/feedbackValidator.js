import { body, param } from "express-validator";
import FeedbackType from "../../models/FeedbackType.js";
import FeedbackPriority from "../../models/FeedbackPriority.js";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";
import mongoose from "../../config/mongodb.js";
import FeedbackStatus from "../../models/FeedbackStatus.js";
import Feedback from "../../models/Feedback.js";
import User from "../../models/User.js";

export const validateFeedbackStore = [
  body("title").notEmpty().withMessage("Le titre est obligatoire"),
  body("description").optional(),
  body("user_agent")
    .notEmpty()
    .withMessage("Information du navigateur obligatoire"),
  body("width").notEmpty().withMessage("Largeur ecran obligatoire"),
  body("height").notEmpty().withMessage("Hauteur ecran obligatoire"),
  body("type")
    .notEmpty()
    .withMessage("Le type de feedback est obligatoire")
    .custom(async (value) => {
      if (value) {
        let type_exist = await FeedbackType.findById(value);
        if (!type_exist) {
          throw new Error("Le type de feedback n'existe pas");
        }
        return true;
      }
    }),
  body("priority")
    .notEmpty()
    .withMessage("La priorité est obligatoire")
    .custom(async (value) => {
      if (value) {
        let type_exist = await FeedbackPriority.findById(value);
        if (!type_exist) {
          throw new Error("La priorité de feedback n'existe pas");
        }
        return true;
      }
    }),
  body("attachments").optional(),

  body("project_id")
    .notEmpty()
    .withMessage("Le projet est obligatoire")
    .custom(async (value) => {
      if (value !== null) {
        let project_exist = await Project.findById(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        return true;
      }
      return true;
    }),

  body("session_id")
    .optional()
    .custom(async (value) => {
      // Ignore vide, null ou "null"
      if (!value || value === "null") {
        return true;
      }

      // Vérifier format ObjectId
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Format de session_id invalide");
      }

      // Vérif existence en base
      const session_exist = await Session.findById(value);
      if (!session_exist) {
        throw new Error("La session n'existe pas");
      }
      return true;
    }),
];

export const validateFeedbackPerProject = [
  body("project_id")
    .notEmpty()
    .withMessage("Le projet est obligatoire")
    .custom(async (value) => {
      if (value !== null) {
        let project_exist = await Project.findById(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        return true;
      }
      return true;
    }),
];

export const validateShowFeedback = [
  param("feedback_id")
    .notEmpty()
    .withMessage("Le feedback est obligatoire")
    .custom(async (value) => {
      if (value !== null) {
        let feedack = await Feedback.findById(value);
        if (!feedack) {
          throw new Error("Le feddback n'existe pas");
        }
        return true;
      }
      return true;
    }),
];

export const validateUpdateFeedback = [
  param("feedback_id")
    .notEmpty()
    .withMessage("Le feedback est obligatoire")
    .custom(async (value) => {
      if (value !== null) {
        let feedack = await Feedback.findById(value);
        if (!feedack) {
          throw new Error("Le feddback n'existe pas");
        }
        return true;
      }
      return true;
    }),

  body("type")
    .optional()
    .custom(async (value) => {
      if (value) {
        let feedack = await FeedbackType.findById(value);
        if (!feedack) {
          throw new Error("Le type de feedback n'existe pas");
        }
        return true;
      }
      return true;
    }),

  body("priority")
    .optional()
    .custom(async (value) => {
      if (value) {
        let feedack = await FeedbackPriority.findById(value);
        if (!feedack) {
          throw new Error("La priorité de feedback n'existe pas");
        }
        return true;
      }
      return true;
    }),

  body("status")
    .optional()
    .custom(async (value) => {
      if (value) {
        let feedack = await FeedbackStatus.findById(value);
        if (!feedack) {
          throw new Error("Le status de feedback n'existe pas");
        }
        return true;
      }
      return true;
    }),

  body("description")
    .optional()
    .isString()
    .withMessage("Chaine de caractère attendu"),

  body("assignTo")
    .optional()
    .custom(async (value) => {
      if (value) {
        let user = await User.findById(value);
        if (!user) {
          throw new Error("L'utilisateur n'existe pas");
        }
      }
      return true;
    }),
];
