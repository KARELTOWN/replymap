import moment from "moment";
import * as integrationRepository from "../../repositories/integrationRepository.js";
import * as projectRepository from "../../repositories/projectRepository.js";
import * as feedbackRepository from "../../repositories/feedbackRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import integrationService, { credentialsFor, integrationList } from "./integrationService.js";
import * as trello from "./trelloApi.js";

const { integrationLoginUrl, getTrelloWebhookCallbackURL } = integrationService();

// Dashboard use cases of an integration: connecting the tool, choosing the
// board, reading its lists and labels, and mapping them to feedback statuses.
//
// Project membership is checked upstream by requireProjectMember, except for
// the authorisation link, whose project travels in the query string.

const TOKEN_LIFETIME_DAYS = 30;

// What the dashboard may know about a connection: never the token itself.
const toConnection = (connection) => ({
  _id: connection._id,
  integration: connection.integration,
  project_id: connection.project_id,
  board: connection.board ?? null,
  expiredAt: connection.expiredAt,
});

const assertKnown = (integration) => {
  if (!integrationList.includes(integration)) throw new AppError("INTEGRATION_UNKNOWN");
};

// The most recent connection tells "never connected" from "expired": the
// dashboard offers a reconnection in both cases, with a different message.
const requireActiveConnection = async (projectId, integration) => {
  assertKnown(integration);
  const connection = await integrationRepository.findAny(projectId, integration);
  if (!connection) throw new AppError("INTEGRATION_NOT_CONNECTED");
  if (connection.isExpired()) throw new AppError("INTEGRATION_EXPIRED");
  return connection;
};

const requireBoard = (connection) => {
  if (!connection.board) throw new AppError("INTEGRATION_BOARD_REQUIRED");
  return connection.board;
};

// The Trello client answers null when the remote call fails.
const remote = async (call) => {
  const result = await call;
  if (result === null || result === undefined) throw new AppError("INTEGRATION_REMOTE_FAILURE");
  return result;
};

export default function integrationSetupService() {
  const loginUrls = async ({ user, projectId, integration }) => {
    assertKnown(integration);
    if (!(await projectRepository.exists(projectId))) throw new AppError("PROJECT_NOT_FOUND");
    // The authorisation link binds a token to this project: members only.
    if (!(await projectRepository.isMember(user._id, projectId))) {
      throw new AppError("PROJECT_NOT_MEMBER");
    }

    const current = await integrationRepository.findAny(projectId, integration);
    if (current && !current.isExpired()) throw new AppError("INTEGRATION_ALREADY_CONNECTED");

    return { [integration]: integrationLoginUrl(projectId, integration) };
  };

  const connect = async ({ projectId, integration, token }) => {
    assertKnown(integration);
    const current = await integrationRepository.findAny(projectId, integration);
    if (current && !current.isExpired()) throw new AppError("INTEGRATION_ALREADY_CONNECTED");
    if (current && current.token === token) throw new AppError("INTEGRATION_TOKEN_REUSED");

    const connection = await integrationRepository.create({
      integration,
      project_id: projectId,
      token,
      expiredAt: moment().add(TOKEN_LIFETIME_DAYS, "days").toDate(),
      default: true,
    });
    return toConnection(connection);
  };

  const boards = async ({ projectId, integration }) => {
    const connection = await requireActiveConnection(projectId, integration);
    const list = await remote(trello.listBoards(credentialsFor(connection)));
    return {
      boards: list,
      default: connection.board,
      status_mapping: connection.status_mapping,
    };
  };

  // Saving the board must not fail when the webhook cannot be registered (for
  // instance a backend not publicly reachable in local development): status
  // synchronisation is simply unavailable until the webhook is active.
  const selectBoard = async ({ projectId, integration, board }) => {
    const connection = await requireActiveConnection(projectId, integration);
    connection.board = board;
    await integrationRepository.save(connection);

    registerBoardWebhook(connection).catch((error) =>
      console.error("Integration webhook registration", error)
    );
    return toConnection(connection);
  };

  const lists = async ({ projectId, integration }) => {
    const connection = await requireActiveConnection(projectId, integration);
    return remote(trello.listOpenLists(credentialsFor(connection), requireBoard(connection)));
  };

  const labels = async ({ projectId, integration }) => {
    const connection = await requireActiveConnection(projectId, integration);
    return remote(trello.listLabels(credentialsFor(connection), requireBoard(connection)));
  };

  const createLabel = async ({ projectId, integration, libelle, color }) => {
    const connection = await requireActiveConnection(projectId, integration);
    return remote(
      trello.createLabel(credentialsFor(connection), requireBoard(connection), {
        name: libelle,
        color,
      })
    );
  };

  const saveStatusMapping = async ({ projectId, integration, mapping }) => {
    const connection = await requireActiveConnection(projectId, integration);

    const known = new Set((await feedbackRepository.findStatuses()).map((status) => String(status._id)));
    if (mapping.some((entry) => !known.has(String(entry.status)))) {
      throw new AppError("INTEGRATION_STATUS_UNKNOWN");
    }

    connection.status_mapping = mapping.map(({ list_id: listId, status }) => ({
      list_id: listId,
      status,
    }));
    await integrationRepository.save(connection);
    return connection.status_mapping;
  };

  // A Trello webhook is bound to one board: it is recreated whenever the
  // project switches board, and the previous one is deleted so no orphan
  // callback keeps firing.
  const registerBoardWebhook = async (connection) => {
    if (connection.integration !== "trello" || !connection.board) return null;

    const credentials = credentialsFor(connection);
    if (connection.webhook_id) {
      await trello.deleteWebhook(credentials, connection.webhook_id);
      connection.webhook_id = null;
    }

    const webhook = await trello.createWebhook(credentials, {
      callbackURL: getTrelloWebhookCallbackURL(),
      modelId: connection.board,
    });
    connection.webhook_id = webhook?.id ?? null;
    await integrationRepository.save(connection);
    return webhook;
  };

  return {
    loginUrls,
    connect,
    boards,
    selectBoard,
    lists,
    labels,
    createLabel,
    saveStatusMapping,
  };
}
