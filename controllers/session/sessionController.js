import { matchedData } from "express-validator";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import sessionService from "../../services/session/sessionService.js";
import { flowOf } from "../../services/session/sessionFlowService.js";

const service = sessionService();

// HTTP layer of recording sessions. Rules live in sessionService.
//
// Payload shapes (`data.session_id`, `data.session`, `data.sessions`...) are kept
// as they were, so the widget already embedded on customer sites and the
// dashboard keep reading them unchanged.

export default function sessionController() {
  const createSession = async (req, res) => {
    assertValid(req);
    const data = await service.create(matchedData(req));
    return ApiResponse.created(res, { messageKey: "session.created", data });
  };

  const updateEndAt = async (req, res) => {
    assertValid(req);
    const { session_id: sessionId, endedAt } = matchedData(req);

    const data = await service.end({
      sessionId,
      projectId: req.trackedProject._id,
      endedAt,
    });
    return ApiResponse.ok(res, { messageKey: "session.ended", data });
  };

  const showSession = async (req, res) => {
    assertValid(req);
    const { session_id: sessionId } = matchedData(req);

    const data = await service.lifecycle(sessionId);
    return ApiResponse.ok(res, { messageKey: "session.fetched", data });
  };

  // The path of a session: pages visited and forms sent, as a graph the
  // dashboard animates rather than a list of lines.
  const showSessionFlow = async (req, res) => {
    assertValid(req);
    const { session_id: sessionId } = matchedData(req);

    const data = await flowOf({ user: req.user, sessionId });
    return ApiResponse.ok(res, { messageKey: "session.flowFetched", data });
  };

  const getSessions = async (req, res) => {
    assertValid(req);
    const data = await service.list({ user: req.user, pagination: req.pagination });
    return ApiResponse.ok(res, { messageKey: "session.listed", data });
  };

  const filterSessions = async (req, res) => {
    assertValid(req);
    const data = await service.list({
      user: req.user,
      filters: matchedData(req),
      pagination: req.pagination,
    });
    return ApiResponse.ok(res, { messageKey: "session.listed", data });
  };

  const showSessionWithChunks = async (req, res) => {
    assertValid(req);
    const { session_id: sessionId, skip, limit } = matchedData(req);

    const data = await service.replay({ user: req.user, sessionId, skip, limit });
    return ApiResponse.ok(res, { messageKey: "session.fetched", data });
  };

  // The people who may be filtered on, for the listing screen.
  const getSessionVisitors = async (req, res) => {
    const data = await service.knownVisitors(req.user);
    return ApiResponse.ok(res, { messageKey: "session.visitorsListed", data });
  };

  return {
    createSession,
    getSessionVisitors,
    updateEndAt,
    showSession,
    showSessionFlow,
    getSessions,
    filterSessions,
    showSessionWithChunks,
  };
}
