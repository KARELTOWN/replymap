import { Worker } from "bullmq";
import IORedis from "ioredis";
import chunkService from "../../services/chunk/chunkService.js";
const { uploadChunksInJsonFile } = chunkService();
import mongoose from "../../config/mongodb.js";

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
      if (!exist) {
        const result = await uploadChunksInJsonFile(chunk, project);
        if (result) {
          chunk.storage_link = result;
          await mongoose.model("Chunk").insertOne(chunk);
          console.log(`chunk enregistré`);
        } else {
          throw new Error("Erreur upload de chunk");
        }
      }
    } catch (error) {
      console.log("Erreur upload de chunk", error);
      throw new Error("Erreur upload de chunk");
    }
  },
  { connection }
);
