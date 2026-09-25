import * as feedbackRepository from "../../repositories/feedbackRepository.js";
import * as integrationRepository from "../../repositories/integrationRepository.js";
import feedbackService from "../feedback/feedbackService.js";
import integrationService from "./integrationService.js";

const { recordExternalStatusChange, getFeedbackReferences } = feedbackService();
const { verifyTrelloWebhookSignature, getTrelloWebhookCallbackURL } = integrationService();

// Inbound synchronisation: the external tool tells us a card moved.
//
// This used to live inside the webhook controller, which read models directly
// and decided on its own what a move meant. The rule is the product's, so it
// belongs here; the controller only verifies the signature and hands over the
// payload.

const TOOL = "trello";

/**
 * Applies a card move to the matching feedback.
 *
 * @returns {Promise<{applied: boolean, reason?: string}>} why nothing happened,
 * when nothing happened. The webhook never fails on these: the external tool
 * disables an endpoint that keeps answering with errors.
 */
export const applyExternalCardMove = async ({ boardId, cardId, listId }) => {
  if (!boardId || !cardId || !listId) return { applied: false, reason: "incomplete" };

  const connection = await integrationRepository.findByBoard(boardId, TOOL);
  if (!connection) return { applied: false, reason: "unknown_board" };

  const mapping = (connection.status_mapping || []).find(
    (entry) => entry.list_id === listId
  );
  // A list without a configured status is not an error: not every column of
  // the external board has a counterpart here.
  if (!mapping) return { applied: false, reason: "list_not_mapped" };

  const feedback = await feedbackRepository.findByCardId(cardId, connection.project_id);
  if (!feedback) return { applied: false, reason: "unknown_card" };

  // A move triggered by BugReveal comes back here as an echo. Without this
  // check, every status change produced a second history entry credited to the
  // external tool.
  if (String(feedback.status) === String(mapping.status)) {
    return { applied: false, reason: "already_applied" };
  }

  await feedbackRepository.updateById(feedback._id, { status: mapping.status });

  const { statuses } = await getFeedbackReferences();
  const label =
    statuses.find((status) => String(status._id) === String(mapping.status))?.libelle ||
    "unknown";

  await recordExternalStatusChange({
    feedbackId: feedback._id,
    statusLabel: label,
    tool: TOOL,
  });

  return { applied: true };
};

// Trello signs every call with the callback URL it was registered with.
export const isAuthenticTrelloDelivery = ({ rawBody, signature }) =>
  verifyTrelloWebhookSignature(rawBody ?? "", getTrelloWebhookCallbackURL(), signature);

// Only card updates matter; any other action of the board is ignored.
export const applyTrelloAction = async (action) => {
  if (action?.type !== "updateCard") return { applied: false, reason: "ignored_action" };
  return applyExternalCardMove({
    boardId: action.data?.board?.id,
    cardId: action.data?.card?.id,
    listId: action.data?.listAfter?.id,
  });
};

export default { applyExternalCardMove, isAuthenticTrelloDelivery, applyTrelloAction };
