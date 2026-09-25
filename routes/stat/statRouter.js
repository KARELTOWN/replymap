import express from "express";
import statController from "../../controllers/stat/statController.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
import { handle } from "../../middleware/errorHandler.js";

const statRouter = express.Router();
const { getStats } = statController();

statRouter.get("/get", isauthentificate, blacklist, handle(getStats));

export default statRouter;
