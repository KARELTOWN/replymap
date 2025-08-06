import { matchedData, validationResult } from "express-validator";
import { createEventsLog } from "../../services/event/eventService.js";
import EventType from "../../models/EventType.js";

export default function eventController() {
  const createEvents = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const response = await createEventsLog(data.events);
      if (response === true) {
        res.status(200).json({ message: "Events enregistrés" });
      }
    } catch (error) {
      next(error);
    }
  };

  return {
    createEvents,
  };
}
