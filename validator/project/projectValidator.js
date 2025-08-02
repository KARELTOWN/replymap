import { body, param, query } from "express-validator";
import User from "../../models/User.js";
import Project from "../../models/Project.js";

export const validateProject = [
  body("libelle").notEmpty().withMessage("Le libelle est obligatoire"),
  body("link").notEmpty().withMessage("Le lien est obligatoire"),
  // .isURL()
  // .withMessage("Lien du projet invalide"),
];

export const validateShowProject = [
  param("id").notEmpty().withMessage("Le projet est obligatoire"),
];
