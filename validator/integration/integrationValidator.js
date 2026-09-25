import { body, query } from "express-validator";
import { integrationList, colorList } from "../../services/integration/integrationService.js";

// Shape of the integration inputs. Whether the project is connected, and
// whether that connection is still valid, are rules of integrationSetupService.

const knownIntegration = (field) =>
  field
    .notEmpty()
    .withMessage("validation.integrationRequired")
    .bail()
    .isIn(integrationList)
    .withMessage("validation.unknownIntegration");

const projectId = () =>
  body("project_id")
    .notEmpty()
    .withMessage("validation.projectRequired")
    .bail()
    .isMongoId()
    .withMessage("validation.invalidProjectId");

const boardId = () =>
  body("board")
    .notEmpty()
    .withMessage("validation.boardRequired")
    .bail()
    .isString()
    .withMessage("validation.stringExpected");

// OAuth entry point: both values travel in the query string.
export const validateIntegrationLogin = [
  knownIntegration(query("name")),
  query("project")
    .notEmpty()
    .withMessage("validation.projectRequired")
    .bail()
    .isMongoId()
    .withMessage("validation.invalidProjectId"),
];

// The webhook payload comes from outside and is only signature-checked. The
// values actually consumed are validated like any other input.
export const validateTrelloWebhook = [
  body("action.type").optional().isString(),
  body("action.data.board.id").optional().isString(),
  body("action.data.card.id").optional().isString(),
  body("action.data.listAfter.id").optional().isString(),
];

export const validateStoreToken = [
  projectId(),
  knownIntegration(body("integration")),
  body("token")
    .notEmpty()
    .withMessage("validation.tokenRequired")
    .bail()
    .isString()
    .withMessage("validation.stringExpected"),
];

export const validateGetIntegrationData = [projectId(), knownIntegration(body("integration"))];

export const validateBoardID = [boardId()];

export const validateGetBoardLabel = [projectId(), knownIntegration(body("integration"))];

export const validateCreateBoardLabel = [
  projectId(),
  knownIntegration(body("integration")),
  body("libelle").trim().notEmpty().withMessage("validation.labelNameRequired"),
  body("color")
    .notEmpty()
    .withMessage("validation.unknownColor")
    .bail()
    .isIn(colorList)
    .withMessage("validation.unknownColor"),
];

export const validateStatusMapping = [
  projectId(),
  knownIntegration(body("integration")),
  body("mapping").isArray().withMessage("validation.mappingListExpected"),
  body("mapping.*.list_id")
    .notEmpty()
    .withMessage("validation.listRequired")
    .bail()
    .isString()
    .withMessage("validation.stringExpected"),
  body("mapping.*.status").isMongoId().withMessage("validation.invalidStatusId"),
];
