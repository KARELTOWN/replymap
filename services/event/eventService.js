import moment from "moment";
import * as eventRepository from "../../repositories/eventRepository.js";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import { projectScope } from "../access/accessService.js";
import { escapeRegex } from "../../shared/text/escapeRegex.js";

// Tracked events: ingestion from the widget, listing in the dashboard.

const dateRange = ({ start_date: start, end_date: end }) => {
  // Event `createdAt` is a Date: comparing it with the epoch numbers the
  // previous version produced never matched, so date filters returned nothing.
  if (start && end) return { $gte: moment(start).toDate(), $lte: moment(end).toDate() };
  if (start) return { $gte: moment(start).toDate() };
  if (end) return { $lte: moment(end).toDate() };
  return null;
};

export default function eventService() {
  const getTypes = () => eventRepository.findTypes();

  /**
   * Stores a batch sent by the widget. Events are keyed by uniqueId, so a batch
   * retried after a network failure is stored once.
   */
  const ingest = async (events) => {
    // The widget sends type names ("page_view", "runtime_errors"...). They are
    // resolved in one query; an event with an unknown type is dropped rather
    // than failing the whole batch, so one bad event never loses the others.
    const types = await eventRepository.findTypesByNames([
      ...new Set(events.map((event) => event.type)),
    ]);
    const typeIds = new Map(types.map((type) => [type.libelle, type._id]));
    const typed = events
      .filter((event) => typeIds.has(event.type))
      .map((event) => ({ ...event, type: typeIds.get(event.type) }));
    if (typed.length < events.length) {
      console.warn(`Dropped ${events.length - typed.length} event(s) with an unknown type`);
    }
    events = typed;

    const known = await eventRepository.findExistingUniqueIds(
      events.map((event) => event.uniqueId)
    );

    // One lookup for every session the batch mentions, instead of one per event.
    const sessionIds = [...new Set(events.map((event) => event.session).filter(Boolean))];
    const liveSessions = await sessionRepository.existingIds(sessionIds);

    const fresh = [];
    for (const event of events) {
      if (known.has(event.uniqueId)) continue;
      // An event may reference a session that expired in between: it is kept,
      // detached from the session.
      if (event.session && !liveSessions.has(String(event.session))) {
        event.session = null;
      }
      fresh.push(event);
    }

    await eventRepository.insertMany(fresh);
    return { stored: fresh.length };
  };

  const list = async ({ user, filters = {}, pagination, errorsOnly = false }) => {
    const { skip, limit, page } = pagination;
    const filter = { project: await projectScope(user, filters.project) };

    if (filters.search) {
      filter.page_url = { $regex: escapeRegex(filters.search), $options: "i" };
    }
    const createdAt = dateRange(filters);
    if (createdAt) filter.createdAt = createdAt;
    if (filters.session) filter.session = { $eq: filters.session };

    // Pages visited and forms sent are the path of a session: they are read as
    // a flow on the session page. Listed here, they were thousands of lines
    // burying the handful of errors one came for — so they are excluded even
    // when asked for by identifier.
    const flowTypes = await eventRepository.findFlowTypeIds();

    if (filters.eventtype) {
      filter.type = { $eq: filters.eventtype, $nin: flowTypes };
    } else if (errorsOnly) {
      filter.type = { $in: await eventRepository.findErrorTypeIds() };
    } else {
      filter.type = { $nin: flowTypes };
    }

    const [events, total] = await Promise.all([
      eventRepository.list({ filter, skip, limit }),
      eventRepository.count(filter),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  return { getTypes, ingest, list };
}
