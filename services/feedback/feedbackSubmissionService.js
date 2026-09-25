import { promises as fs } from "fs";
import * as feedbackRepository from "../../repositories/feedbackRepository.js";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import fileService from "../files/fileService.js";
import integrationService from "../integration/integrationService.js";
import { getDefaultFeedbackStatus } from "./feedbackService.js";

const { uploadFileOnS3, uploadFilesOnS3 } = fileService();
const { createCardIntegration } = integrationService();

// Background persistence of a submitted feedback.
//
// Submission and persistence are split: the HTTP call only queues the upload,
// and this module does the slow part in a worker. It used to be split across
// two jobs running in parallel on separate queues, one storing the feedback,
// one creating the external card, both reading the same temporary files. The
// first to finish deleted them: when the feedback was stored first, the card
// creation failed on every retry and the card never appeared. Everything now
// runs in one job, in order, and the files are deleted last.

const METADATA_FIELDS = [
  "user_agent",
  "width",
  "height",
  "viewport_width",
  "viewport_height",
  "language",
  "timezone",
  "device_pixel_ratio",
  "referrer",
];

const readUpload = async (upload) => ({ ...upload, buffer: await fs.readFile(upload.path) });

// Markers of a page are matched by origin and path: query strings and hashes
// vary between visits of the same page.
const normaliseUrl = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
};

const removeUploads = async (uploads) => {
  await Promise.all(
    uploads.map((upload) =>
      fs.unlink(upload.path).catch((error) => {
        if (error.code !== "ENOENT") console.error("Temporary upload cleanup", error.message);
      })
    )
  );
};

export default function feedbackSubmissionService({ notifyCreation } = {}) {
  const linkExternalCard = async ({ feedbackId, payload, screenshot, attachments }) => {
    try {
      const card = await createCardIntegration({
        title: payload.title,
        description: payload.description || "",
        type: payload.type,
        integration: payload.integration,
        list_id: payload.list_id,
        project_id: payload.project_id,
        file: screenshot,
        files: attachments,
      });
      if (!card?.id) return null;

      await feedbackRepository.updateById(feedbackId, {
        integration: payload.integration,
        integration_card_id: card.id,
        integration_card_url: card.shortUrl || card.url || null,
      });
      return card;
    } catch (error) {
      // The feedback is stored: a failed card is reported, not fatal. It can
      // still be sent to the tool manually from the dashboard.
      console.error("External card creation", error);
      return null;
    }
  };

  // Any failure throws before the temporary files are removed: the queue
  // retries the job, and a retry needs them.
  const persist = async ({ file, attachments = [], feedback: payload }) => {
    const uploads = [file, ...attachments];
    const screenshot = await readUpload(file);
    const extra = await Promise.all(attachments.map(readUpload));

    const storedScreenshot = await uploadFileOnS3(screenshot, payload.project_id);
    if (!storedScreenshot) throw new Error("Screenshot upload failed");

    const storedAttachments = extra.length
      ? await uploadFilesOnS3(extra, payload.project_id)
      : [];
    if (!storedAttachments || storedAttachments.length !== extra.length) {
      throw new Error("Attachment upload failed");
    }

    const status = await getDefaultFeedbackStatus();
    if (!status) throw new Error("No feedback status configured: run the seeders");

    const metadata = Object.fromEntries(METADATA_FIELDS.map((field) => [field, payload[field]]));
    const screenshotRecord = await feedbackRepository.createFile(storedScreenshot);

    const feedback = await feedbackRepository.create({
      ...payload,
      metadata,
      url: normaliseUrl(payload.url),
      status: status._id,
      file: screenshotRecord._id,
    });

    await feedbackRepository.createFiles(
      storedAttachments.map((stored) => ({ ...stored, feedback_id: feedback._id }))
    );

    // The session that carried this feedback now has a name on it.
    if (payload.session_id && payload.created_by) {
      await sessionRepository
        .attachAccount(payload.session_id, payload.created_by)
        .catch((error) => console.error("Session attribution", error));
    }

    if (payload.integration && payload.list_id) {
      await linkExternalCard({
        feedbackId: feedback._id,
        payload,
        screenshot,
        attachments: extra,
      });
    }

    // The notification must not fail (nor replay) the job: the feedback is
    // already stored.
    if (notifyCreation) {
      await notifyCreation(feedback._id, payload.created_by || null).catch((error) =>
        console.error("Feedback notification", error)
      );
    }

    await removeUploads(uploads);
    return feedback._id;
  };

  // Jobs queued before this change on the former "feedbackSaveInIntegration"
  // queue. Their temporary files may already be gone; such a job is dropped
  // with a log line instead of being retried until it expires.
  const persistLegacyCard = async ({ file, attachments = [], feedback: payload }) => {
    let screenshot;
    let extra;
    try {
      screenshot = await readUpload(file);
      extra = await Promise.all(attachments.map(readUpload));
    } catch {
      console.warn("Legacy card job dropped: temporary files are gone");
      return null;
    }
    if (!payload._id) return null;
    return linkExternalCard({ feedbackId: payload._id, payload, screenshot, attachments: extra });
  };

  return { persist, persistLegacyCard };
}
