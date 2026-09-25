import Events from "../models/Events.js";
import EventType from "../models/EventType.js";
import { SUPPORTED_EVENT_TYPES, FLOW_EVENT_TYPES } from "../shared/events/eventTypes.js";

// Data access for tracked events (errors, rage clicks, slow requests...).

const ERROR_TYPE_NAMES = ["runtime_errors", "unhandle_promise_rejection", "request_errors"];

// Only the maintained types are offered as a filter: one left over in the
// collection would be proposed and never match anything. The types that make
// up the path of a session are left out too — they are read as a flow on the
// session page, and offering them here would propose a filter that answers
// nothing.
export const findTypes = () =>
  EventType.find({
    libelle: { $in: SUPPORTED_EVENT_TYPES, $nin: FLOW_EVENT_TYPES },
  })
    .sort({ libelle: 1 })
    .lean();

export const findTypeByName = (libelle) => EventType.findOne({ libelle }).lean();

export const findTypesByNames = (names) =>
  EventType.find({ libelle: { $in: names } }).lean();

const idsOfTypes = async (names) =>
  (await EventType.find({ libelle: { $in: names } }).select("_id").lean()).map((type) => type._id);

// The types read as a flow on the session page.
export const findFlowTypeIds = () => idsOfTypes(FLOW_EVENT_TYPES);

// Events of one session that make up its path, oldest first.
export const findFlowOfSession = async (sessionId) =>
  Events.find({ session: sessionId, type: { $in: await findFlowTypeIds() } })
    .populate({ path: "type", model: "EventType", select: "libelle" })
    .sort({ timestamp: 1, createdAt: 1 })
    .lean();

export const findErrorTypeIds = async () =>
  (await EventType.find({ libelle: { $in: ERROR_TYPE_NAMES } }).select("_id").lean()).map(
    (type) => type._id
  );

// One query for the whole batch: the previous version checked each event with
// its own `exists` call.
export const findExistingUniqueIds = async (uniqueIds) =>
  new Set(
    (await Events.find({ uniqueId: { $in: uniqueIds } }).select("uniqueId").lean()).map(
      (event) => event.uniqueId
    )
  );

export const insertMany = (events) =>
  events.length > 0 ? Events.insertMany(events, { ordered: false }) : Promise.resolve([]);

export const list = ({ filter, skip, limit }) => {
  const query = Events.find(filter)
    .populate([
      { path: "project", model: "Project", select: "libelle" },
      { path: "session", model: "Session", select: "uniqueId" },
      { path: "type", model: "EventType", select: "libelle" },
    ])
    .sort({ createdAt: -1 });
  if (limit > 0) query.skip(skip).limit(limit);
  return query.lean().exec();
};

export const count = (filter) => Events.countDocuments(filter);

export const existsInProject = async (projectId) =>
  Boolean(await Events.exists({ project: projectId }));

export const lastCreatedAt = async (projectId) =>
  (
    await Events.findOne({ project: projectId })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean()
  )?.createdAt ?? null;

export const countOfProject = (projectId) => Events.countDocuments({ project: projectId });
