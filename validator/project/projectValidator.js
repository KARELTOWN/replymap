import { body, param, query } from "express-validator";
import User from "../../models/User.js";
import Project from "../../models/Project.js";
import moment from "moment";
import _ from "lodash";
import Session from "../../models/Session.js";
import Events from "../../models/Events.js";

export const validateProject = [
  body("libelle").notEmpty().withMessage("Le libelle est obligatoire"),
  body("link").notEmpty().withMessage("Le lien est obligatoire"),
  // .isURL()
  // .withMessage("Lien du projet invalide"),
];

export const validateShowProject = [
  param("id").notEmpty().withMessage("Le projet est obligatoire"),
];

export const validateUpdateProject = [
  param("project_id")
    .notEmpty()
    .withMessage("Le projet est obligatoire")
    .custom(async (value) => {
      if (value) {
        let project_exist = await Project.findById(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        const session_exists = await Session.exists({ project_id: value });
        if (session_exists === true) {
          throw new Error("Impossible de modifier ce projet");
        }
        return true;
      }
    }),
  body("link")
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      const { project_id } = req.params;
      const projet = await Project.exists({
        link: value,
        _id: { $nin: [project_id] },
      });
      if (projet) {
        throw new Error("Existe déjà");
      }
      let myproject = await Project.findOne({ _id: project_id });
      if (myproject.link !== value) {
        let session_exist = await Session.exists({
          project_id: project_id,
        }).exec();
        let event_exist = await Events.exists({ project: project_id });
        if (session_exist || event_exist) {
          throw new Error(
            "Modification impossible. Le projet a déjà en cours d'utilisation"
          );
        }
      }

      return true;
    }),
  body("libelle")
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      const { project_id } = req.params;
      const projet = await Project.exists({
        libelle: value,
        _id: { $nin: [project_id] },
      });
      if (projet) {
        throw new Error("Existe déjà");
      }
      return true;
    }),
  body("track").optional().isObject(),
];

export const validateFilterProject = [
  body("search")
    .optional()
    .isString()
    .withMessage("Un chaine de caractère est attendu"),
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

export const validateInviteUser = [
  body("email")
    .notEmpty()
    .withMessage("Utilisateur obligatoire")
    .custom(async (value) => {
      let user = await User.findOne({ email: value });
      if (!user) {
        throw new Error("Aucun utilisateur correspondant à cet email");
      }
      console.log("user", user);
      if (user.email_verified === true && user.is_active === true) {
        return true;
      } else {
        throw new Error("L'utilisateur est inactif ou non vérifié");
      }
    }),

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
];

export const validateProjectIDBody = [
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
];

export const validateProjectIDParam = [
  param("project_id")
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
];

export const validateQuitProject = [
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
  body("user_id").custom(async (value) => {
    if (value) {
      let user = await User.findById(value);
      if (!user) {
        throw new Error("L'utilisateur n'existe pas");
      }
      return true;
    }
  }),
];
