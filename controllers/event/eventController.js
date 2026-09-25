import { matchedData } from "express-validator";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import eventService from "../../services/event/eventService.js";

const service = eventService();

// HTTP layer of tracked events. Rules live in eventService.

export default function eventController() {
  const createEvents = async (req, res) => {
    assertValid(req);
    const { events } = matchedData(req);

    const data = await service.ingest(events);
    return ApiResponse.created(res, { messageKey: "event.stored", data });
  };

  const getIssues = async (req, res) => {
    assertValid(req);
    const data = await service.list({ user: req.user, pagination: req.pagination });
    return ApiResponse.ok(res, { messageKey: "event.listed", data });
  };

  const filterIssues = async (req, res) => {
    assertValid(req);
    const filters = matchedData(req);

    const data = await service.list({
      user: req.user,
      filters,
      pagination: req.pagination,
      errorsOnly: filters.is_error === true,
    });
    return ApiResponse.ok(res, { messageKey: "event.listed", data });
  };

  const getEventTypes = async (req, res) => {
    const data = await service.getTypes();
    return ApiResponse.ok(res, { messageKey: "event.typesListed", data });
  };

  return { createEvents, getIssues, filterIssues, getEventTypes };
}
