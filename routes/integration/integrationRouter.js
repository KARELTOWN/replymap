import express from "express";
const IntegrationRouter = express.Router();
import {
  validateStoreToken,
  validateGetIntegrationData,
  validateBoardID,
  validateCreateBoardLabel,
  validateGetBoardLabel,
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
} = integrationController();
IntegrationRouter.get("/login", getLoginURLs);
IntegrationRouter.post("/store_token", validateStoreToken, storeToken);
IntegrationRouter.post("/get_boards", validateGetIntegrationData, getBoards);
IntegrationRouter.post(
  "/update",
  validateGetIntegrationData,
  validateBoardID,
  updateIntegration
);

IntegrationRouter.post(
  "/get_board_lists",
  validateGetIntegrationData,
  getBoardLists
);

IntegrationRouter.post(
  "/get_board_labels",
  validateGetBoardLabel,
  getBoardLabels
);

IntegrationRouter.post(
  "/create_board_labels",
  validateCreateBoardLabel,
  createBoardLabel
);

export default IntegrationRouter;
