import { QueueEvents } from "bullmq";

const recordChunkEvents = new QueueEvents("recording_chunk_store");

recordChunkEvents.on('waiting', ({jobId}) => {
    console.log(`A chunk job with ID ${jobId} is waiting`)
})
recordChunkEvents.on('active', ({jobId, prev}) => {
    console.log(`A chunk job with ID ${jobId} is active. Previous status : ${prev}`)
})
recordChunkEvents.on("progress", ({ jobId, data }, timestamp) => {
  console.log(`Chunk job ${jobId} reported progress at ${timestamp}`);
});
recordChunkEvents.on('completed', ({jobId, returnvalue}) => {
    console.log(`A chunk job with ID ${jobId} is completed and return ${returnvalue}`)
})
recordChunkEvents.on('failed', ({jobId, failedReason}) => {
    console.log(`A chunk job with ID ${jobId} is failed because : ${failedReason}`)
})


const mailingEvents = new QueueEvents("mailing");

mailingEvents.on('waiting', ({jobId}) => {
    console.log(`A mail job with ID ${jobId} is waiting`)
})
mailingEvents.on('active', ({jobId, prev}) => {
    console.log(`A mail job with ID ${jobId} is active. Previous status : ${prev}`)
})
mailingEvents.on("progress", ({ jobId, data }, timestamp) => {
  console.log(`Mail job ${jobId} reported progress at ${timestamp}`);
});
mailingEvents.on('completed', ({jobId, returnvalue}) => {
    console.log(`A mail job with ID ${jobId} is completed and return ${returnvalue}`)
})
mailingEvents.on('failed', ({jobId, failedReason}) => {
    console.log(`A mail job with ID ${jobId} is failed because : ${failedReason}`)
})