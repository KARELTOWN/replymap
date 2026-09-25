import express from "express";
const IntegrationRouter = express.Router();
import {
  validateStoreToken,
  validateGetIntegrationData,
  validateBoardID,
  validateCreateBoardLabel,
  validateGetBoardLabel,
  validateStatusMapping,
  validateIntegrationLogin,
  validateTrelloWebhook,
} from "../../validator/integration/integrationValidator.js";
import integrationController from "../../controllers/integration/integrationController.js";
const {
  getLoginURLs,
  storeToken,
  getBoards,
  updateIntegration,
  getBoardLists,
  getBoardLabels,
  createBoardLabel,
  saveStatusMapping,
  trelloWebhookVerify,
  trelloWebhookHandler,
} = integrationController();
import { requireProjectMember } from "../../middleware/projectAccess.js";
import { handle } from "../../middleware/errorHandler.js";

// Every route below targets a specific project: without this check, an
// authenticated account could read the Trello board (lists, labels) and change
// the integration of a project it does not belong to.

// Trello calls this URL directly (no JWT possible): it must stay outside
// the authenticated router below. Mounted separately in routes/api.js, before
// the mount protected by isauthentificate/blacklist.
export const IntegrationWebhookRouter = express.Router();
IntegrationWebhookRouter.head("/trello/webhook", trelloWebhookVerify);
IntegrationWebhookRouter.post(
  "/trello/webhook",
  validateTrelloWebhook,
  handle(trelloWebhookHandler)
);
IntegrationRouter.get("/login", validateIntegrationLogin, handle(getLoginURLs));
IntegrationRouter.post("/store_token", requireProjectMember, validateStoreToken, handle(storeToken));
IntegrationRouter.post("/get_boards", requireProjectMember, validateGetIntegrationData, handle(getBoards));
IntegrationRouter.post(
  "/update",
  requireProjectMember,
  validateGetIntegrationData,
  validateBoardID,
  handle(updateIntegration)
);

IntegrationRouter.post(
  "/get_board_lists",
  requireProjectMember,
  validateGetIntegrationData,
  handle(getBoardLists)
);


IntegrationRouter.post(
  "/get_board_labels",
  requireProjectMember,
  validateGetBoardLabel,
  handle(getBoardLabels)
);

IntegrationRouter.post(
  "/create_board_labels",
  requireProjectMember,
  validateCreateBoardLabel,
  handle(createBoardLabel)
);

IntegrationRouter.post(
  "/status_mapping",
  requireProjectMember,
  validateStatusMapping,
  handle(saveStatusMapping)
);

export default IntegrationRouter;
