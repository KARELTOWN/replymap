import { matchedData, validationResult } from "express-validator";
import storeChunkJob from "../../queue/chunk/queue.js";
export default function chunkController() {
  const storeChunk = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);
    try {
      await storeChunkJob(data);
      res.status(200).json({
        message: "Events created in processing",
      });
    } catch (error) {
      next(error);
    }
  };
  return {
    storeChunk,
  };
}
