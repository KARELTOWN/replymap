import { connectionRedis } from "./ioredis.js";
import { QueueEvents } from "bullmq";

function logQueueEvents(queueName) {
  const events = new QueueEvents(queueName, {connection: connectionRedis});

  events.on('waiting', ({ jobId }) => {
    console.log(`[${queueName}] Job ${jobId} is waiting`);
  });

  events.on('active', ({ jobId, prev }) => {
    console.log(`[${queueName}] Job ${jobId} is active (prev: ${prev})`);
  });

  events.on('progress', ({ jobId, data }, ts) => {
    console.log(`[${queueName}] Job ${jobId} progress at ${ts}:`, data);
  });

  events.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[${queueName}] Job ${jobId} completed with:`, returnvalue);
  });

  events.on('failed', ({ jobId, failedReason }) => {
    console.error(`[${queueName}] Job ${jobId} failed:`, failedReason);
  });

  return events;
}

// Usage
const recordChunkEvents = logQueueEvents("recording_chunk_store");
const mailingEvents = logQueueEvents("mailing");
const feedbackStore = logQueueEvents("feedback");

