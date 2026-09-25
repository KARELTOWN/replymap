import { body } from "express-validator";

// Shape of a chunk upload. That every session belongs to the project is
// checked by the service, in one query for the whole batch: the previous
// version queried the database once per chunk, inside the validator.

const MAX_BATCH = 200;

export const validateStoreChunk = [
  body("project_id").isMongoId().withMessage("validation.invalidProjectId"),
  body("events").isArray({ min: 1, max: MAX_BATCH }).withMessage("validation.eventsRequired"),
  body("events.*.session_id").isMongoId().withMessage("validation.invalidSessionId"),
  body("events.*.uniqueId").isUUID().withMessage("validation.invalidEventId"),
  body("events.*.timestamp").notEmpty().withMessage("validation.timestampRequired"),
  body("events.*.events").isArray({ min: 1 }).withMessage("validation.eventsRequired"),
];
