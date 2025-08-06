import { QueueEvents } from "bullmq";

const queueEvents = new QueueEvents("recording_chunk_store");

queueEvents.on('waiting', ({jobId}) => {
    console.log(`A job with ID ${jobId} is waiting`)
})
queueEvents.on('active', ({jobId, prev}) => {
    console.log(`A job with ID ${jobId} is active. Previous status : ${prev}`)
})
queueEvents.on("progress", ({ jobId, data }, timestamp) => {
  console.log(`${jobId} reported progress at ${timestamp}`);
});
queueEvents.on('completed', ({jobId, returnvalue}) => {
    console.log(`A job with ID ${jobId} is completed and return ${returnvalue}`)
})
queueEvents.on('failed', ({jobId, failedReason}) => {
    console.log(`A job with ID ${jobId} is failed because : ${failedReason}`)
})