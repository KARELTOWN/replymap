import { body } from "express-validator";
import Feedback from "../../models/Feedback.js";

export const validateCommentStore = [
  body("feedback_id")
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

  body("content")
    .notEmpty()
    .withMessage("Contenu obligatoire")
    .isString()
    .withMessage("Le contenu doit être une chaine de caractère")
    .isLength({ min: 1 })
    .withMessage("Le contenu doit avoir au moins 1 caractère"),
];
