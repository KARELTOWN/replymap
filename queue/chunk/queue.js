import { Queue } from "bullmq";
const myQueue = new Queue("recording_chunk_store");
export default async function storeChunkJob(data) {
  let queues = [];
  for (const dt of data.events) {
    queues.push({
      name: `recording_chunks_${Date.now()}`,
      data: { chunk: dt, project: data.project_id },
      opts: {
        attempts: 3, // nombre de tentatives
        backoff: {
          type: "fixed", //
          delay: 10000, //milliseconde : delai avant prochaine tentative
          removeOnComplete: {
            age: 60, // après une minute : seconde
          },
        },
        ttl: 1000 * 60 * 60 * 24 * 30, //durée de vie du job : en ms
      },
    });
  }
  await myQueue.addBulk(queues); // ajout un à un mais performant
}
