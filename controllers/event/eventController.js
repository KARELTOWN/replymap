import { matchedData, validationResult } from "express-validator";
import {
  createEventsLog,
  EventModelFilter,
} from "../../services/event/eventService.js";
import moment from "moment";
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

  const getIssues = async (req, res, next) => {
    try {
      const { limit, skip, page } = req.pagination;
      const result = await EventModelFilter(req, {}, skip, limit, false);
      const { total_issues, issues_list } = result;
      const data = {
        events: issues_list,
        total: total_issues,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total_issues / limit),
      };

      res.status(200).json({
        message: "Issues récupérées",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  };

  const filterIssues = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);

      const { limit, skip, page } = req.pagination;
      let query = {};

      if (data.search) {
        query.page_url = { $regex: data.search, $options: "i" };
      }
      let start_date, end_date;
      if (data.start_date && data.end_date) {
        start_date = moment(data.start_date).valueOf();
        end_date = moment(data.end_date).valueOf();
        query.createdAt = { $gte: start_date, $lte: end_date };
      } else if (data.start_date && !data.end_date) {
        start_date = moment(data.start_date).valueOf();
        query.createdAt = { $gte: start_date };
      } else if (!data.start_date && data.end_date) {
        end_date = moment(data.end_date).valueOf();
        query.createdAt = { $lte: end_date };
      }

      if (data.project) {
        query.project = { $eq: data.project };
      }
      if (data.session) {
        query.session = { $eq: data.session };
      }
      if (data.eventtype) {
        query.type = { $eq: data.eventtype };
      }

      let error = null;
      if (data.is_error === true) {
        error = true;
      }

      const result = await EventModelFilter(req, query, skip, limit, error);
      const { total_issues, issues_list } = result;

      let dt = {
        events: issues_list,
        total: total_issues,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total_issues / limit),
      };

      res.status(200).json({
        message: "Events filtered",
        data: dt,
      });
    } catch (error) {
      next(error);
    }
  };

  const getEventTypes = async (req, res, next) => {
    try {
      const result = await EventType.find({}).sort({ libelle: 1 });
      res.status(200).json({
        message: "Issues récupérées",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createEvents,
    getIssues,
    filterIssues,
    getEventTypes,
  };
}
