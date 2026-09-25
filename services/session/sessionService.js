import moment from "moment";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import * as userRepository from "../../repositories/userRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { projectScope, assertProjectAccess } from "../access/accessService.js";
import { readSessionEvents } from "../chunk/chunkService.js";

// Recording sessions: creation and end by the widget, listing and replay in
// the dashboard.

export const checkSessionExist = (sessionId) => sessionRepository.exists(sessionId);

const dateRange = ({ start_date: start, end_date: end }) => {
  if (start && end) return { $gte: moment(start).toDate(), $lte: moment(end).toDate() };
  if (start) return { $gte: moment(start).toDate() };
  if (end) return { $lte: moment(end).toDate() };
  return null;
};

export default function sessionService() {
  // --- Widget ---------------------------------------------------------------

  const create = async (payload) => {
    const sequence = await sessionRepository.nextSequence();
    const session = await sessionRepository.create({
      ...payload,
      uniqueId: `session-${sequence}`,
    });
    return { session_id: session._id };
  };

  // The guard already attributed the call to a project; the session must belong
  // to that same project, otherwise any known session id could be closed.
  const end = async ({ sessionId, projectId, endedAt }) => {
    const session = await sessionRepository.endInProject(sessionId, projectId, endedAt);
    if (!session) throw new AppError("NOT_FOUND");
    return { session_id: session._id };
  };

  const lifecycle = async (sessionId) => {
    const session = await sessionRepository.findLifecycle(sessionId);
    if (!session) throw new AppError("NOT_FOUND");
    return { session };
  };

  // --- Dashboard ------------------------------------------------------------

  const list = async ({ user, filters = {}, pagination }) => {
    const { skip, limit, page } = pagination;
    const filter = { project_id: await projectScope(user, filters.project_id) };

    const createdAt = dateRange(filters);
    if (createdAt) filter.createdAt = createdAt;

    // Who the visitor was: the member who left feedback from the session, or
    // the anonymous identifier kept in their browser.
    if (filters.account) filter.account = filters.account;
    if (filters.visitor) filter.user_id = filters.visitor;

    const [sessions, total] = await Promise.all([
      sessionRepository.list({ filter, skip, limit }),
      sessionRepository.count(filter),
    ]);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  // Replaying a session exposes a full recording of the visitor's screen. It
  // was reachable by any signed-in account knowing a session id; it now
  // requires access to the session's project.
  const replay = async ({ user, sessionId, skip, limit }) => {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new AppError("NOT_FOUND");
    await assertProjectAccess(user, session.project_id);

    const events = await readSessionEvents({ sessionId, skip, limit });
    return { session, events };
  };

  // The people the caller may filter on, for the listing screen.
  const knownVisitors = async (user) => {
    const ids = await sessionRepository.accountsInScope(await projectScope(user));
    return userRepository.findManyProfiles(ids);
  };

  return { create, end, lifecycle, list, replay, knownVisitors };
}
