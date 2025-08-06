import express from "express";
const eventRouter = express.Router();
import eventController from "../../controllers/event/eventController.js";
import { validateStoreEvent, editEventType } from "../../validator/event/eventValidator.js";
const { createEvents } = eventController();
eventRouter.post("/store", editEventType, validateStoreEvent, createEvents);

export default eventRouter;
