import { matchedData } from "express-validator";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import integrationSetupService from "../../services/integration/integrationSetupService.js";
import {
  applyTrelloAction,
  isAuthenticTrelloDelivery,
} from "../../services/integration/integrationSyncService.js";

const service = integrationSetupService();

// HTTP layer of integrations. Rules live in integrationSetupService (dashboard)
// and integrationSyncService (webhook).

const connectionOf = (req) => {
  const { project_id: projectId, integration, ...rest } = matchedData(req);
  return { projectId, integration, ...rest };
};

export default function integrationController() {
  const getLoginURLs = async (req, res) => {
    assertValid(req);
    const { name, project } = matchedData(req);

    const data = await service.loginUrls({ user: req.user, projectId: project, integration: name });
    return ApiResponse.ok(res, { messageKey: "integration.loginUrls", data });
  };

  const storeToken = async (req, res) => {
    assertValid(req);
    const data = await service.connect(connectionOf(req));
    return ApiResponse.created(res, { messageKey: "integration.connected", data });
  };

  const getBoards = async (req, res) => {
    assertValid(req);
    const data = await service.boards(connectionOf(req));
    return ApiResponse.ok(res, { messageKey: "integration.boardsListed", data });
  };

  const updateIntegration = async (req, res) => {
    assertValid(req);
    const data = await service.selectBoard(connectionOf(req));
    return ApiResponse.ok(res, { messageKey: "integration.updated", data });
  };

  const getBoardLists = async (req, res) => {
    assertValid(req);
    const data = await service.lists(connectionOf(req));
    return ApiResponse.ok(res, { messageKey: "integration.listsListed", data });
  };

  const getBoardLabels = async (req, res) => {
    assertValid(req);
    const data = await service.labels(connectionOf(req));
    return ApiResponse.ok(res, { messageKey: "integration.labelsListed", data });
  };

  const createBoardLabel = async (req, res) => {
    assertValid(req);
    const data = await service.createLabel(connectionOf(req));
    return ApiResponse.created(res, { messageKey: "integration.labelCreated", data });
  };

  const saveStatusMapping = async (req, res) => {
    assertValid(req);
    const data = await service.saveStatusMapping(connectionOf(req));
    return ApiResponse.ok(res, { messageKey: "integration.mappingUpdated", data });
  };

  // Trello sends a HEAD request to the callback URL when the webhook is
  // created, to check it is reachable before sending any event.
  const trelloWebhookVerify = (req, res) => res.status(200).send();

  // Trello expects a bare status, not the JSON envelope, and disables a webhook
  // that is slow or keeps failing: the answer is sent before the work is done.
  const trelloWebhookHandler = async (req, res) => {
    const authentic = isAuthenticTrelloDelivery({
      rawBody: req.rawBody ? req.rawBody.toString("utf8") : "",
      signature: req.get("x-trello-webhook"),
    });
    if (!authentic) return res.status(401).send();

    res.status(200).send();

    const { action } = matchedData(req);
    applyTrelloAction(action).catch((error) => console.error("Trello webhook", error));
  };

  return {
    getLoginURLs,
    storeToken,
    getBoards,
    getBoardLists,
    updateIntegration,
    getBoardLabels,
    createBoardLabel,
    saveStatusMapping,
    trelloWebhookVerify,
    trelloWebhookHandler,
  };
}
