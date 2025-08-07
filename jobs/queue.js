import { Queue } from "bullmq";
const recordChunksQueues = new Queue("recording_chunk_store", {
  defaultJobOptions: {
    attempts: 3, // nombre de tentatives
    backoff: {
      type: "fixed", //
      delay: 10000, //milliseconde : delai avant prochaine tentative
      removeOnComplete: true, //supprimer le job si terminé
    },
    ttl: 1000 * 60 * 60 * 24 * 30, //durée de vie du job : en ms
  },
});
const mailingQueues = new Queue("mailing", {
  defaultJobOptions: {
    attempts: 3, // nombre de tentatives
    backoff: {
      type: "fixed", //
      delay: 10000, //milliseconde : delai avant prochaine tentative
      removeOnComplete: true, //supprimer le job si terminé
    },
    ttl: 1000 * 60 * 60 * 24 * 30, //durée de vie du job : en ms
  },
});
export const storeChunkJob = async (data) => {
  let queues = [];
  for (const dt of data.events) {
    queues.push({
      name: `recording_chunks_${Date.now()}`,
      data: { chunk: dt, project: data.project_id },
      // opts: {
      //   attempts: 3, // nombre de tentatives
      //   backoff: {
      //     type: "fixed", //
      //     delay: 10000, //milliseconde : delai avant prochaine tentative
      //     removeOnComplete: true, //supprimer le job si terminé
      //   },
      //   ttl: 1000 * 60 * 60 * 24 * 30, //durée de vie du job : en ms
      // },
    });
  }
  await recordChunksQueues.addBulk(queues); // ajout un à un mais performant
};

export const mailingJob = async (mail_data) => {
  await mailingQueues.add(`send_mail_at_${Date.now()}`, mail_data); // ajout un à un mais performant
};
