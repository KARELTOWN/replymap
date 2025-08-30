import express from "express";
const chunkRouter = express.Router();
import chunkController from "../../controllers/chunk/chunkController.js";
import { validateStoreChunk } from "../../validator/chunk/chunkValidator.js";
import { decompressPako } from "../../utils/util.js";

const { storeChunk } = chunkController();
chunkRouter.post("/store", validateStoreChunk, storeChunk);

export default chunkRouter;
