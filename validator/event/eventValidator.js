import { body } from "express-validator";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";
import EventType from "../../models/EventType.js";
import validator from "validator";
import moment from "moment";

export const editEventType = async (req, res, next) => {
  const { events } = req.body;
  if (Array.isArray(events) && events.length > 0) {
    let modifyEvents = [];
    for (const event of events) {
      if (event.type) {
        let type = await EventType.findOne({ libelle: event.type });
        if (!type) {
          throw new Error(`Le type ${event.type} n'existe pas`);
        } else {
          event.type = type._id;
          modifyEvents.push(event);
        }
      } else {
        next(new Error("Un des types d'évenement est invalide"));
      }
    }
    req.body.events = modifyEvents;
    next();
  } else {
    next(new Error("Aucune donnée"));
  }
};
export const validateStoreEvent = [
  body("events")
    .notEmpty()
    .withMessage("Les évenements sont obligatoires")
    .custom(async (value) => {
      for (const item of value) {
        if (
          (Array.isArray(item.data) && item.data.length == 0) ||
          !item.project ||
          !item.page_url ||
          !item.timestamp ||
          !item.type ||
          !item.uniqueId
        ) {
          throw new Error("Erreur tracké invalide");
        }
        if (!item.data) {
          throw new Error("Data Obligatoire");
        }
        if (!item.uniqueId || !validator.isUUID(item.uniqueId)) {
          throw new Error("Identifiant d'événement invalide.");
        }
        if (item.session) {
          let session_exist = await Session.findById(item.session);
          if (!session_exist) {
            throw new Error(`La session ${item.session} n'existe pas`);
          }
        }
        if (item.project) {
          let project_exist = await Project.findById(item.project);
          if (!project_exist) {
            throw new Error(`Le projet ${item.project} n'existe pas`);
          }
        }
      }
      return true;
    }),
];

export const validateEventFilter = [
  body("search")
    .optional()
    .isString()
    .withMessage("Un chaine de caractère est attendu"),
  body("start_date").custom((value) => {
    if (value !== null && value !== "" && value) {
      if (moment(value, "YYYY-MM-DD").isValid()) {
        return true;
      } else {
        throw new Error("Date invalide");
      }
    } else {
      return true;
    }
  }),
  ,
  body("end_date").custom((value) => {
    if (value !== null && value !== "" && value) {
      if (moment(value, "YYYY-MM-DD").isValid()) {
        return true;
      } else {
        throw new Error("Date invalide");
      }
    } else {
      return true;
    }
  }),

  body("session").custom(async (value) => {
    if (value) {
      let session_exist = await Session.findById(value);
      if (!session_exist) {
        throw new Error("La session n'existe pas");
      }
      return true;
    }
  }),
  body("project").custom(async (value) => {
    if (value) {
      let project_exist = await Project.findById(value);
      if (!project_exist) {
        throw new Error("Le projet n'existe pas");
      }
      return true;
    }
  }),
  body("eventtype").custom(async (value) => {
    if (value) {
      let type_exist = await EventType.findById(value);
      if (!type_exist) {
        throw new Error("Le type d'événement n'existe pas");
      }
      return true;
    }
  }),
  body("is_error").custom(async (value) => {
    if (value) {
      if (value === true || value === false) {
        return true;
      }
      throw new Error("Booleen attendu");
    }
  }),
];
