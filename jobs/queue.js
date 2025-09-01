import { Queue } from "bullmq";
import { connectionRedis } from "./ioredis.js";
import { performance } from "perf_hooks";
const defaultOptions = {
  attempts: 5,
  backoff: { type: "fixed", delay: 10000 },
  removeOnComplete: true,
  ttl: 1000 * 60 * 60 * 24 * 15,
};

function queueWorker(queueName) {
  return new Queue(queueName, {
    defaultJobOptions: defaultOptions,
    connection: connectionRedis,
  });
}

const recordChunksQueues = queueWorker("recording_chunk_store");
const feedbackStoreQueues = queueWorker("feedback");
const mailingQueues = queueWorker("mailing");

export const storeChunkJob = async (data) => {
  let queues = [];
  for (const dt of data.events) {
    queues.push({
      name: `recording_chunks_${Date.now()}`,
      data: { chunk: dt, project: data.project_id },
    });
  }
  await recordChunksQueues.addBulk(queues); // ajout un à un mais performant
};

export const storeFeedbackJob = async (data) => {
  try {
    let attachments = Array.from(data.attachments);
    await feedbackStoreQueues.add(`feedback_${Date.now()}`, {
      file: data.file,
      attachments: attachments,
      feedback: data.feedback,
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const mailingJob = async (mail_data) => {
  await mailingQueues.add(`send_mail_at_${Date.now()}`, mail_data); // ajout un à un mais performant
};