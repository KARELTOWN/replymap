import express from "express";
const statRouter = express.Router();
import statController from "../../controllers/stat/statController.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";
const { getStats } = statController();

statRouter.get("/get", isauthentificate, blacklist, getStats);

export default statRouter;
