import { matchedData, validationResult } from "express-validator";
import { createEventsLog } from "../../services/event/eventService.js";
import { EventModelFilter } from "../../models/Events.js";
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
      const result = await EventModelFilter(req, {}, skip, limit, true);
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

  return {
    createEvents,
    getIssues,
  };
}
