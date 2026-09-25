import * as integrationRepository from "../../repositories/integrationRepository.js";
import * as feedbackRepository from "../../repositories/feedbackRepository.js";
import fileService from "../files/fileService.js";
import { getKeysIntegration } from "../../utils/keys.js";
import * as trello from "./trelloApi.js";

// Outbound integration logic for feedback: which list, which label, and when.
//
// The raw HTTP calls live in trelloApi.js. Connecting a tool, choosing its board
// and mapping statuses are dashboard use cases, in integrationSetupService.js.
//
// Trello is the only integration of the MVP.

export const integrationList = ["trello"];

export const colorList = [
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "blue",
  "sky",
  "lime",
  "pink",
  "black",
];

const { getFileFromS3 } = fileService();

export const credentialsFor = (connection) => ({
  apiKey: getKeysIntegration("trello").apiTrello,
  token: connection.token,
});

export default function integrationService() {
  const getTrelloWebhookCallbackURL = () =>
    `${process.env.BACKEND_URL}/api/integration/trello/webhook`;

  const integrationLoginUrl = (projectId, integration) => {
    if (integration !== "trello") return "";
    const keys = getKeysIntegration(integration);
    return trello.buildAuthorizeUrl({
      apiKey: keys.apiTrello,
      expiration: keys.expirationTokenTrello,
      scope: keys.scopeTrello,
      returnType: keys.trelloReturnType,
      returnUrl: `${keys.returnURLTrello}/${projectId}/${integration}`,
    });
  };

  // Each feedback type maps to a label of the same name on the board, created
  // on first use so the board stays readable without manual setup.
  const resolveTypeLabel = async (card) => {
    try {
      const type = await feedbackRepository.findTypeById(card.type);
      if (!type) return null;

      const connection = await integrationRepository.findActive(card.project_id, card.integration);
      if (!connection?.board) return null;

      const credentials = credentialsFor(connection);
      const labels = await trello.listLabels(credentials, connection.board);
      if (!labels) return null;

      const existing = labels.find(
        (label) => label.name.toUpperCase() === type.libelle.toUpperCase()
      );
      if (existing) return existing;

      return trello.createLabel(credentials, connection.board, {
        name: type.libelle,
        color: colorList.includes(type.color) ? type.color : null,
      });
    } catch (error) {
      console.error("Integration type label", error);
      return null;
    }
  };

  const createCardIntegration = async (card) => {
    try {
      const connection = await integrationRepository.findActive(
        card.project_id,
        card.integration
      );
      if (!connection) return null;

      const label = await resolveTypeLabel(card);
      if (!label) {
        console.error("Integration card: no label could be resolved for the type");
        return null;
      }

      const credentials = credentialsFor(connection);
      const created = await trello.createCard(credentials, {
        listId: card.list_id,
        name: card.title,
        description: card.description,
        labelIds: [label.id],
      });
      if (!created?.id) return null;

      // Screenshot first, then the attachments. The screenshot used to be
      // prepended twice, so every card carried it in double.
      const files = [card.file, ...(Array.isArray(card.files) ? card.files : [])].filter(
        (file) => file?.buffer
      );
      if (files.length > 0) {
        await trello
          .uploadAttachments(credentials, created.id, files)
          .catch((error) => console.error("Integration attachments", error));
      }

      return created;
    } catch (error) {
      console.error("Integration card creation", error);
      return null;
    }
  };

  // Attaches a file already in object storage: used when a feedback is sent to
  // the tool after submission, once the raw buffer is gone.
  //
  // The bytes are sent, not a link: stored files are private, and a signed link
  // would stop working on the card once it expired.
  const attachStoredFileToCard = async ({
    integration,
    project_id: projectId,
    card_id: cardId,
    key,
    name,
  }) => {
    try {
      const connection = await integrationRepository.findActive(projectId, integration);
      if (!connection) return false;

      const { buffer, mimetype } = await getFileFromS3(key);
      return trello.uploadAttachments(credentialsFor(connection), cardId, [
        { buffer, mimetype, originalname: name },
      ]);
    } catch (error) {
      console.error("Integration file attachment", error);
      return false;
    }
  };

  // Moves the external card into the list mapped to the new status.
  //
  // Synchronisation used to run one way only: a card moved in Trello updated
  // the feedback, but a status changed here moved nothing, and the two boards
  // drifted apart as soon as someone worked from the dashboard.
  const moveCardToStatusList = async ({ integration, project_id: projectId, card_id: cardId, status }) => {
    try {
      if (!integration || !cardId || !status) return { moved: false, reason: "incomplete" };

      const connection = await integrationRepository.findActive(projectId, integration);
      if (!connection) return { moved: false, reason: "integration_missing" };

      const mapping = (connection.status_mapping || []).find(
        (entry) => String(entry.status) === String(status)
      );
      // A status without a configured list is not an error: not every column
      // of this board has a counterpart in the external tool.
      if (!mapping) return { moved: false, reason: "status_not_mapped" };

      const moved = await trello.moveCard(credentialsFor(connection), cardId, mapping.list_id);
      return moved
        ? { moved: true, list_id: mapping.list_id }
        : { moved: false, reason: "remote_failure" };
    } catch (error) {
      console.error("Integration card move", error);
      return { moved: false, reason: "exception" };
    }
  };

  const verifyTrelloWebhookSignature = (rawBody, callbackURL, signature) => {
    try {
      return trello.verifySignature({
        secret: getKeysIntegration("trello").secretTrello,
        rawBody,
        callbackURL,
        signature,
      });
    } catch (error) {
      console.error("Webhook signature", error);
      return false;
    }
  };

  return {
    integrationList,
    integrationLoginUrl,
    createCardIntegration,
    moveCardToStatusList,
    attachStoredFileToCard,
    colorList,
    verifyTrelloWebhookSignature,
    getTrelloWebhookCallbackURL,
  };
}
