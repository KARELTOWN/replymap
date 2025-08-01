import { matchedData, validationResult } from "express-validator";
import Chunk from "../../models/Chunk.js";
import eventService from "../../services/eventService.js";
import Project from "../../models/Project.js";
const { uploadChunksInJsonFile } = eventService();
export default function chunkController() {
  const storeChunk = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);
    try {
      for (const dt of data.events) {
        const result = await uploadChunksInJsonFile(dt, data.project_id);
        console.log("store json file in s3 result", result);
        dt.events = [];
        dt.events = result;
        const exist = await Project.exists({ uniqueId: dt.uniqueId });
        if (exist) {
          continue;
        }
        await Chunk.insertOne(dt);
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
