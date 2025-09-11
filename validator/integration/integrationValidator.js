import { body, validationResult } from "express-validator";
import { checkProjectExist } from "../../services/project/projectService.js";

import integrationService from "../../services/integration/integrationService.js";
const { integrationList, colorList } = integrationService();
import IntegrationToken from "../../models/IntegrationToken.js";

export const validateStoreToken = [
  body("project_id")
    .notEmpty()
    .withMessage("Le projet est requis")
    .custom(async (value, { req }) => {
      if (value) {
        let project_exist = await checkProjectExist(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas ");
        }
        let integrationExist = await IntegrationToken.findOne({
          project_id: value,
          integration: req.body.integration,
        });
        if (integrationExist) {
          if (!integrationExist.isExpired()) {
            throw new Error("L'intégration existe déjà");
          } else {
            if (integrationExist.token === req.body.token) {
              throw new Error("Token déjà utilisé");
            }
          }
        }
        return true;
      }
    }),
  body("integration")
    .notEmpty()
    .withMessage("integration_is_required")
    .custom((value) => {
      if (!integrationList.includes(value)) {
        throw new Error("Intégration inconnue");
      }

      return true;
    }),
  body("token")
    .notEmpty()
    .withMessage("Le token est obligatoire")
    .isString()
    .withMessage("Le token doit être une chaine de caractère"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetIntegrationData = [
  body("project_id")
    .notEmpty()
    .withMessage("Le projet est requis")
    .custom(async (value, { req }) => {
      if (value) {
        let project_exist = await checkProjectExist(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas");
        }
        let integrationExist = await IntegrationToken.findOne({
          project_id: value,
          integration: req.body.integration,
        });
        if (integrationExist) {
          if (integrationExist.isExpired()) {
            throw new Error("expired");
          }
        } else {
          throw new Error("not_found");
        }
        return true;
      }
    }),

  body("integration")
    .notEmpty()
    .withMessage("integration_is_required")
    .custom((value) => {
      if (!integrationList.includes(value)) {
        throw new Error("Intégration inconnue");
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateBoardID = [
  body("board")
    .notEmpty()
    .withMessage("Obligatoire")
    .isString()
    .withMessage("L'identifiant du tableau doit être une chaine de caractère"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateCreateBoardLabel = [
  body("integration")
    .notEmpty()
    .withMessage("integration_is_required")
    .custom((value) => {
      if (!integrationList.includes(value)) {
        throw new Error("Intégration inconnue");
      }
      return true;
    }),
  body("board")
    .notEmpty()
    .withMessage("Obligatoire")
    .isString()
    .withMessage("L'identifiant du tableau doit être une chaine de caractère"),
  body("libelle")
    .notEmpty()
    .withMessage("Le nom de l'étiquette est obligatoire"),
  body("color")
    .notEmpty()
    .withMessage("Le nom de l'étiquette est obligatoire")
    .custom((value) => {
      if (!colorList.includes(value)) {
        throw new Error("Couleur inconnue");
      }
      return true;
    }),
  body("project_id")
    .notEmpty()
    .withMessage("Le projet est requis")
    .custom(async (value, { req }) => {
      if (value) {
        let project_exist = await checkProjectExist(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas ");
        }
        let integrationExist = await IntegrationToken.findOne({
          project_id: value,
          integration: req.body.integration,
        });
        if (integrationExist) {
          if (integrationExist.isExpired()) {
            throw new Error("L'intégration a expirée");
          }
        } else {
          throw new Error("L'intégration n'existe pas");
        }
        return true;
      }
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetBoardLabel = [
  body("integration")
    .notEmpty()
    .withMessage("integration_is_required")
    .custom((value) => {
      if (!integrationList.includes(value)) {
        throw new Error("Intégration inconnue");
      }
      return true;
    }),
  body("board")
    .notEmpty()
    .withMessage("Obligatoire")
    .isString()
    .withMessage("L'identifiant du tableau doit être une chaine de caractère"),
  body("project_id")
    .notEmpty()
    .withMessage("Le projet est requis")
    .custom(async (value, { req }) => {
      if (value) {
        let project_exist = await checkProjectExist(value);
        if (!project_exist) {
          throw new Error("Le projet n'existe pas ");
        }
        let integrationExist = await IntegrationToken.findOne({
          project_id: value,
          integration: req.body.integration,
        });
        if (integrationExist) {
          if (integrationExist.isExpired()) {
            throw new Error("L'intégration a expirée");
          }
        } else {
          throw new Error("L'intégration n'existe pas");
        }
        return true;
      }
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];
