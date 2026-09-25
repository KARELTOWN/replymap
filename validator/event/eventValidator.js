import { body } from "express-validator";
import moment from "moment";

// Shape of the event inputs.
//
// The previous version resolved event type names and checked each event's
// project inside the validator, with one database query per event. Existence
// is now the concern of the ingestion guard (project) and of the service (types,
// sessions), each in a single query.

const MAX_BATCH = 500;

const optionalDate = (field) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) throw new Error("validation.invalidDate");
      return true;
    });

const optionalId = (field) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("validation.invalidIdentifier");

export const validateStoreEvent = [
  body("events")
    .isArray({ min: 1, max: MAX_BATCH })
    .withMessage("validation.eventsRequired"),
  body("events.*.uniqueId").isUUID().withMessage("validation.invalidEventId"),
  body("events.*.project").isMongoId().withMessage("validation.invalidProjectId"),
  body("events.*.page_url").isString().notEmpty().withMessage("validation.pageUrlRequired"),
  body("events.*.timestamp").isNumeric().withMessage("validation.timestampRequired"),
  body("events.*.type").isString().notEmpty().withMessage("validation.eventTypeRequired"),
  body("events.*.data").exists({ values: "null" }).withMessage("validation.eventDataRequired"),
  body("events.*.session")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("validation.invalidSessionId"),
];

export const validateEventFilter = [
  body("search").optional({ nullable: true }).isString().withMessage("validation.stringExpected"),
  optionalDate("start_date"),
  optionalDate("end_date"),
  optionalId("session"),
  optionalId("project"),
  optionalId("eventtype"),
  body("is_error").optional({ nullable: true }).isBoolean().withMessage("validation.booleanExpected"),
];
