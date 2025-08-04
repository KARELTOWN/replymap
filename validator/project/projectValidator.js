import { body, param, query } from "express-validator";
import User from "../../models/User.js";
import Project from "../../models/Project.js";
import moment from "moment";

export const validateProject = [
  body("libelle").notEmpty().withMessage("Le libelle est obligatoire"),
  body("link").notEmpty().withMessage("Le lien est obligatoire"),
  // .isURL()
  // .withMessage("Lien du projet invalide"),
];

export const validateShowProject = [
  param("id").notEmpty().withMessage("Le projet est obligatoire"),
];

export const validateFilterProject = [
  body("search")
    .optional()
    .isString()
    .withMessage("Un chaine de caractère est attendu"),
  body("start_date").custom((value) => {
     if (value !== null && value !== '') {
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
    if (value !== null && value !== '') {
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
