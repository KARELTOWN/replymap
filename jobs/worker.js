import { Worker } from "bullmq";
import IORedis from "ioredis";
import chunkService from "../services/chunk/chunkService.js";
const { uploadChunksInJsonFileOnS3, uploadChunksInJsonFileLocal } =
  chunkService();
import mongoose from "../config/mongodb.js";
import { mailTransporter } from "../config/mailer.js";

const connection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "recording_chunk_store",
  async (job) => {
    try {
      const chunk = job.data.chunk;
      const project = job.data.project;
      const exist = await mongoose
        .model("Chunk")
        .exists({ uniqueId: chunk.uniqueId });
      // SAVE ON S3 STORAGE
      // if (!exist) {
      // const result = await uploadChunksInJsonFileOnS3(chunk, project);
      //   if (result) {
      //     chunk.storage_link = result;
      //     await mongoose.model("Chunk").insertOne(chunk);
      //     console.log(`chunk enregistré`);
      //   } else {
      //     throw new Error("Erreur upload de chunk");
      //   }
      // }

      //SAVE IN DB
      if (!exist) {
        const result = await uploadChunksInJsonFileLocal(chunk, project);
        if (result) {
          chunk.storage_link = result;
          const save = await mongoose.model("Chunk").insertOne(chunk);
          console.log(`chunk enregistré`);
        } else {
          throw new Error("Erreur upload de chunk");
        }
      }
    } catch (error) {
      throw new Error("Erreur upload de chunk");
    }
  },
  { connection }
);

const mailingWorker = new Worker(
  "mailing",
  async (job) => {
    try {
      let mailinfo = job.data;
      const info = await mailTransporter.sendMail({
        from: process.env.MAIL_FROM_NAME,
        to: receiver.to,
        subject: mailinfo.subject,
        html: mailinfo.html,
      });
      if (info) {
        await mongoose.model("Notification").insertOne({
          email: mailinfo.to,
          user_id: mailinfo.user_id,
          title: mailinfo.subject,
          content: mailinfo.html,
          sendAt: Date.now(),
        });
      }
    } catch (error) {
      throw new Error("Erreur envoie de mail");
    }
  },
  { connection }
);
