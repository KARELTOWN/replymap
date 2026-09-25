import { matchedData } from "express-validator";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import { enqueue } from "../../services/chunk/chunkService.js";

// HTTP layer of recording chunk upload. The service checks the sessions belong
// to the project and hands the batch to the queue; files are written by the
// worker.

export default function chunkController() {
  const storeChunk = async (req, res) => {
    assertValid(req);
    const { events } = matchedData(req);

    const data = await enqueue({ projectId: req.trackedProject._id, events });
    return ApiResponse.accepted(res, { messageKey: "session.chunksQueued", data });
  };

  return { storeChunk };
}
