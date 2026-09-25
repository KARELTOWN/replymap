import moment from "moment";
import * as feedbackRepository from "../../repositories/feedbackRepository.js";
import * as userRepository from "../../repositories/userRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import notificationService from "../notification/notificationService.js";
import * as projectRepository from "../../repositories/projectRepository.js";
import { storeFeedbackJob } from "../../jobs/queue.js";
import { checkSessionExist } from "../session/sessionService.js";
import fileService from "../files/fileService.js";
import integrationService from "../../services/integration/integrationService.js";

const { sendMailNotification } = notificationService();
const { getURLFileFromS3 } = fileService();
const { createCardIntegration, attachStoredFileToCard, moveCardToStatusList } =
  integrationService();

// Business rules of the feedback module.
//
// Everything the product decides lives here: which fields may change, what a
// board looks like, when the external card must move, who gets notified.
// The layer above (controller) only translates HTTP, the layer below
// (repository) only talks to the database.

// Fields a member may change from the tracking view. Without this allow-list,
// any field later added to a validator would be written straight to the
// database. Assignment and priority are deliberately absent: BugReveal tracks
// feedback, it does not replace a task manager.
const UPDATABLE_FIELDS = ["type", "status", "title", "description"];

// How a guest author travels through the filters: there is no account to name,
// only the email the visitor typed.
export const GUEST_AUTHOR_PREFIX = "guest:";

const DEFAULT_BOARD_LIMIT = 200;
const MAX_BOARD_LIMIT = 500;

// Statuses and types are seeded reference data, never edited at runtime. They
// were read from the database on every board load, every feedback creation and
// every status change. A short-lived process cache removes those round trips
// without freezing a possible reseed.
const REFERENCE_TTL_MS = 5 * 60 * 1000;
const referenceCache = { at: 0, statuses: null, types: null };

export const getFeedbackReferences = async () => {
  const now = Date.now();
  if (referenceCache.statuses && now - referenceCache.at < REFERENCE_TTL_MS) {
    return { statuses: referenceCache.statuses, types: referenceCache.types };
  }

  const [statuses, types] = await Promise.all([
    feedbackRepository.findStatuses(),
    feedbackRepository.findTypes(),
  ]);

  referenceCache.at = now;
  referenceCache.statuses = statuses;
  referenceCache.types = types;
  return { statuses, types };
};

// Status given to every new feedback.
export const getDefaultFeedbackStatus = async () => {
  const { statuses } = await getFeedbackReferences();
  return statuses.find((status) => status.libelle === "Ouvert") || statuses[0] || null;
};

const findStatusLabel = async (statusId) => {
  const { statuses } = await getFeedbackReferences();
  return statuses.find((status) => String(status._id) === String(statusId))?.libelle;
};

const findTypeLabel = async (typeId) => {
  const { types } = await getFeedbackReferences();
  return types.find((type) => String(type._id) === String(typeId))?.libelle;
};

export default function feedbackService() {
  // --- Reads ---------------------------------------------------------------

  const getParameters = async () => {
    const { statuses, types } = await getFeedbackReferences();
    return { type: types, status: statuses };
  };

  // The board groups feedback by status, empty columns included, so the
  // columns stay stable between two visits.
  // The board is filtered where the data is, not in the browser: a project
  // with hundreds of feedback only ever sent its first page to the dashboard,
  // so filtering there hid what had not been loaded.
  const boardFilter = ({ projectId, author, start_date: start, end_date: end }) => {
    const filter = { project_id: projectId };
    // A guest is named by their email, since there is no account to point at:
    // the filter carries "guest:<email>" to tell the two apart.
    if (author && String(author).startsWith(GUEST_AUTHOR_PREFIX)) {
      filter.guest_email = String(author).slice(GUEST_AUTHOR_PREFIX.length);
    } else if (author) {
      filter.created_by = author;
    }

    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = moment(start).startOf("day").toDate();
      if (end) filter.createdAt.$lte = moment(end).endOf("day").toDate();
    }
    return filter;
  };

  const getBoard = async ({ projectId, limit, ...filters }) => {
    const size = Math.min(Number(limit) || DEFAULT_BOARD_LIMIT, MAX_BOARD_LIMIT);

    const [{ statuses }, feedbacks] = await Promise.all([
      getFeedbackReferences(),
      feedbackRepository.findByProject(boardFilter({ projectId, ...filters }), size),
    ]);

    const columns = new Map(
      statuses.map((status) => [String(status._id), { status, feedbacks: [] }])
    );
    for (const feedback of feedbacks) {
      columns.get(String(feedback.status))?.feedbacks.push(feedback);
    }
    return Array.from(columns.values());
  };

  // Everyone who wrote a feedback on this project: the members, and the guests
  // who only left an email.
  const getAuthors = async (projectId) => {
    const [ids, guestEmails] = await Promise.all([
      feedbackRepository.authorsOfProject(projectId),
      feedbackRepository.guestAuthorsOfProject(projectId),
    ]);

    const members = await userRepository.findManyProfiles(ids);
    const guests = guestEmails.map((email) => ({
      _id: `${GUEST_AUTHOR_PREFIX}${email}`,
      email,
      firstname: null,
      lastname: null,
      guest: true,
    }));

    return [...members.map((member) => ({ ...member, guest: false })), ...guests];
  };

  const getDetail = async (feedbackId) => {
    const feedback = await feedbackRepository.findDetailById(feedbackId);
    if (!feedback) throw new AppError("FEEDBACK_NOT_FOUND");

    // A feedback whose screenshot upload failed has no file: reading its key
    // directly used to raise a type error.
    if (feedback.file?.key) {
      feedback.file.key = await getURLFileFromS3(feedback.file.key);
    }

    const files = await feedbackRepository.findFiles(feedback._id);
    for (const file of files) {
      file.key = await getURLFileFromS3(file.key);
    }

    return { feedback, files };
  };

  const getHistory = (feedbackId) => feedbackRepository.findHistory(feedbackId);

  // --- Writes ---------------------------------------------------------------

  // Creation is asynchronous: uploads and the external card are handled by
  // workers, so the visitor is not kept waiting behind a network round trip.
  /**
   * Stores a feedback, from a member or from a guest.
   *
   * @param {{payload: object, author?: object, guest?: {email: string, name?: string},
   *          file: object, attachments: object[]}} submission
   */
  const submit = async ({ payload, author, guest, file, attachments }) => {
    if (!file) throw new AppError("FEEDBACK_SCREENSHOT_REQUIRED");

    const feedback = { ...payload };

    // Who wrote it never comes from the request body, which the client
    // controls: either the authenticated account, or the guest identity the
    // route validated.
    if (author) {
      feedback.created_by = author._id;
      feedback.email = author.email;
      feedback.guest_email = null;
      feedback.guest_name = null;
    } else {
      feedback.created_by = null;
      feedback.email = guest.email;
      feedback.guest_email = guest.email;
      feedback.guest_name = guest.name || null;
    }

    // A stale or unknown recording session must not fail the submission: it is
    // simply detached.
    if (feedback.session_id && feedback.session_id !== "null") {
      const exists = await checkSessionExist(feedback.session_id);
      if (!exists) feedback.session_id = null;
    } else {
      feedback.session_id = null;
    }

    // A single job stores the feedback and, when requested, creates the
    // external card afterwards: see feedbackSubmissionService.
    await storeFeedbackJob({ file, feedback, attachments });
  };

  const update = async ({ feedback, changes, actorId }) => {
    const accepted = {};
    for (const field of UPDATABLE_FIELDS) {
      if (changes[field] !== undefined) accepted[field] = changes[field];
    }
    if (Object.keys(accepted).length === 0) throw new AppError("FEEDBACK_NO_CHANGES");

    const updated = await feedbackRepository.updateById(feedback._id, accepted);

    // History, notification and external synchronisation must not delay the
    // answer: the board reloads the history right after.
    recordChanges({ feedback: updated, changes: accepted, actorId }).catch((error) =>
      console.error("Feedback history", error)
    );

    // Status is the tracking field: it has to travel back to the external
    // card, otherwise the two boards drift apart on the first move made here.
    if (accepted.status && updated.integration && updated.integration_card_id) {
      moveCardToStatusList({
        integration: updated.integration,
        project_id: updated.project_id,
        card_id: updated.integration_card_id,
        status: updated.status,
      }).catch((error) => console.error("Status synchronisation", error));
    }

    return updated;
  };

  const remove = async (feedback) => {
    await Promise.all([
      feedbackRepository.deleteFiles(feedback._id),
      feedbackRepository.deleteHistory(feedback._id),
    ]);
    await feedbackRepository.deleteById(feedback._id);
  };

  // Manual action from the tracking view: a feedback submitted without an
  // integration has no card until someone decides to send it.
  const sendToIntegration = async ({ feedback, integration, listId }) => {
    if (feedback.integration_card_id) {
      throw new AppError("INTEGRATION_ALREADY_LINKED");
    }

    const card = await createCardIntegration({
      title: feedback.title,
      description: feedback.description || "",
      type: feedback.type,
      integration,
      list_id: listId,
      project_id: feedback.project_id,
    });

    if (!card?.id) throw new AppError("INTEGRATION_REMOTE_FAILURE");

    await feedbackRepository.updateById(feedback._id, {
      integration,
      integration_card_id: card.id,
      integration_card_url: card.shortUrl || card.url || null,
    });

    await attachStoredFiles({ feedback, integration, cardId: card.id });
    return card;
  };

  // Screenshot and attachments already live in object storage, the raw buffer
  // is long gone: they are attached by URL rather than uploaded again.
  const attachStoredFiles = async ({ feedback, integration, cardId }) => {
    const [attachments, mainFile] = await Promise.all([
      feedbackRepository.findFiles(feedback._id),
      feedback.file ? feedbackRepository.findFileById(feedback.file) : null,
    ]);

    const files = [...attachments];
    if (mainFile) files.unshift(mainFile);

    await Promise.all(
      files.map(async (file) => {
        try {
          await attachStoredFileToCard({
            integration,
            project_id: feedback.project_id,
            card_id: cardId,
            key: file.key,
            name: file.name,
          });
        } catch (error) {
          console.error("Card attachment", error);
        }
      })
    );
  };

  // --- History and notifications ---------------------------------------------

  const recordChanges = async ({ feedback, changes, actorId }) => {
    const entries = [];
    const summary = {};

    if (changes.status) {
      const label = await findStatusLabel(changes.status);
      if (label) {
        summary.status = { key: "feedback.statusChanged", params: { status: label } };
        entries.push({
          feedback_id: feedback._id,
          description: `Status changed to ${label}`,
          createdBy: actorId,
        });
      }
    }

    if (changes.type) {
      const label = await findTypeLabel(changes.type);
      if (label) {
        summary.type = { key: "feedback.typeChanged", params: { type: label } };
        entries.push({
          feedback_id: feedback._id,
          description: `Type changed to ${label}`,
          createdBy: actorId,
        });
      }
    }

    // Without this guard, an edit that changes neither status nor type still
    // sent an empty email to every project member.
    if (entries.length === 0) return [];

    const history = await feedbackRepository.createHistoryEntries(entries);
    if (summary.status || summary.type) {
      await notifyUpdate({ feedback, summary, actorId });
    }
    return history;
  };

  // Called by the webhook when the card moves in the external tool.
  const recordExternalStatusChange = async ({ feedbackId, statusLabel, tool }) =>
    feedbackRepository.createHistoryEntry({
      feedback_id: feedbackId,
      description: `Status changed to ${statusLabel} from ${tool}`,
      source: tool,
    });

  const notifyCreation = async (feedbackId, authorId = null) => {
    const feedback = await feedbackRepository.findDetailById(feedbackId);
    if (!feedback) return false;

    // The author already knows what they just wrote.
    const receivers = await projectRepository.membersOf(feedback.project_id._id, authorId);
    if (receivers.length === 0) return true;

    await sendMailNotification({
      receivers,
      params: {
        type: feedback.type?.libelle || "",
        status: feedback.status?.libelle || "",
        title: feedback.title,
        description: feedback.description || "",
        project: feedback.project_id.libelle,
      },
      model_name: "AF",
    });
    return true;
  };

  const notifyUpdate = async ({ feedback, summary, actorId }) => {
    const projectId = feedback.project_id?._id || feedback.project_id;
    const receivers = await projectRepository.membersOf(projectId, actorId);
    if (receivers.length === 0) return true;

    await sendMailNotification({
      receivers,
      params: {
        status: summary.status ? summary.status.params.status : "",
        type: summary.type ? summary.type.params.type : "",
        title: feedback.title,
      },
      model_name: "MF",
    });
    return true;
  };

  return {
    getParameters,
    getBoard,
    getAuthors,
    getDetail,
    getHistory,
    submit,
    update,
    remove,
    sendToIntegration,
    recordChanges,
    recordExternalStatusChange,
    notifyCreation,
    getFeedbackReferences,
    getDefaultFeedbackStatus,
  };
}
