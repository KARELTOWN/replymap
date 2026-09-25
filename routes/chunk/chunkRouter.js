import express from "express";
import chunkController from "../../controllers/chunk/chunkController.js";
import { validateStoreChunk } from "../../validator/chunk/chunkValidator.js";
import { requireTrackedProject } from "../../middleware/trackedProject.js";
import { handle } from "../../middleware/errorHandler.js";

const chunkRouter = express.Router();
const { storeChunk } = chunkController();

// Recording chunk upload: same guard as session creation, this is the endpoint
// that consumes the most storage.
chunkRouter.post("/store", requireTrackedProject, validateStoreChunk, handle(storeChunk));

export default chunkRouter;
