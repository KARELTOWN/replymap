import { matchedData, validationResult } from "express-validator";
import Chunk from "../../models/Chunk.js";
import eventService from "../../services/eventService.js";
import Project from "../../models/Project.js";
import { redisDeleteMultipleKeys } from "../../config/redis.js";
const { uploadChunksInJsonFile } = eventService();
export default function chunkController() {
  const storeChunk = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);
    let all_chunks = [];
    try {
      for (const dt of data.events) {
        const result = await uploadChunksInJsonFile(dt, data.project_id);
        dt.events = [];
        dt.events = result;
        const exist = await Project.exists({ uniqueId: dt.uniqueId });
        if (exist) {
          continue;
        }
        all_chunks.push(dt);
      }

      if (all_chunks.length > 0) {
        await Chunk.insertMany(all_chunks);
      }

      res.status(200).json({
        message: "Events created",
      });
    } catch (error) {
      next(error);
    }
  };
  return {
    storeChunk,
  };
}
