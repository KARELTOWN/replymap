import { Queue } from "bullmq";
import { connectionRedis } from "./ioredis.js";
const defaultOptions = {
  attempts: 3,
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
    // ENCODER LE BUFFER EN BASE 64 , BULLMQ ne traitant pas les buffers
    const encodedFile = {
      ...data.file,
      buffer: data.file.buffer.toString("base64"),
    };

    let attachments = Array.from(data.attachments);
    let encodedAttachments = [];
    if (attachments.length !== 0) {
      encodedAttachments = attachments.map((file) => ({
        ...file,
        buffer: file.buffer.toString("base64"),
      }));
    }

    console.log("encodedAttachments", encodedAttachments);

    await feedbackStoreQueues.add(`feedback_${Date.now()}`, {
      file: encodedFile,
      attachments: encodedAttachments,
      feedback: data.feedback,
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const mailingJob = async (mail_data) => {
  await mailingQueues.add(`send_mail_at_${Date.now()}`, mail_data); // ajout un à un mais performant
};
