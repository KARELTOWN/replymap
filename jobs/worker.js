import { Worker } from "bullmq";
import { connectionRedis } from "./ioredis.js";
import { storeChunk } from "../services/chunk/chunkService.js";
import notificationService from "../services/notification/notificationService.js";
import feedbackService from "../services/feedback/feedbackService.js";
import feedbackSubmissionService from "../services/feedback/feedbackSubmissionService.js";

// Queue consumers.
//
// A worker decodes a job and calls a service, nothing more: business rules
// stay in the service layer, so the HTTP path and the queue path cannot drift
// apart. BullMQ retries a job whose handler throws.

const { deliver } = notificationService();
const { notifyCreation } = feedbackService();
const submissions = feedbackSubmissionService({ notifyCreation });

const options = { connection: connectionRedis };

export const chunkWorker = new Worker(
  "recording_chunk_store",
  (job) => storeChunk(job.data.chunk, job.data.project),
  options
);

export const mailingWorker = new Worker("mailing", (job) => deliver(job.data), options);

export const feedbackWorker = new Worker(
  "feedback",
  (job) => submissions.persist(job.data),
  options
);

// Drains jobs queued before the two feedback jobs were merged into one. Can be
// removed once the "feedbackSaveInIntegration" queue is empty in every
// environment.
export const legacyCardWorker = new Worker(
  "feedbackSaveInIntegration",
  (job) => submissions.persistLegacyCard(job.data),
  options
);
