import Session from "../models/Session.js";
import Counter from "../models/Counter.js";

// Data access for recording sessions.

export const findById = (sessionId) => Session.findById(sessionId).lean();

export const findProjectId = async (sessionId) =>
  (await Session.findById(sessionId).select("project_id").lean())?.project_id ?? null;

// Only what the widget needs to decide whether to resume a session.
export const findLifecycle = (sessionId) =>
  Session.findById(sessionId).select("startedAt endedAt").lean();

export const exists = (sessionId) => Session.exists({ _id: sessionId });

export const existsInProject = async (projectId) =>
  Boolean(await Session.exists({ project_id: projectId }));

export const countInProject = (sessionIds, projectId) =>
  Session.countDocuments({ _id: { $in: sessionIds }, project_id: projectId });

export const existingIds = async (sessionIds) =>
  sessionIds.length === 0
    ? new Set()
    : new Set(
        (await Session.find({ _id: { $in: sessionIds } }).select("_id").lean()).map((session) =>
          String(session._id)
        )
      );

export const markRecording = (sessionId) =>
  Session.updateOne({ _id: sessionId, has_recording: { $ne: true } }, { has_recording: true });

// Sessions with no recording. A closed one is judged quickly, an open one is
// given much longer: it may simply be a quiet visitor whose first chunk has
// not been sent yet.
export const findWithoutRecording = ({ closedBefore, openBefore }, limit) =>
  Session.find({
    has_recording: { $ne: true },
    $or: [
      { endedAt: { $ne: null }, startedAt: { $lt: closedBefore } },
      { endedAt: null, startedAt: { $lt: openBefore } },
    ],
  })
    .select("_id")
    .sort({ startedAt: 1 })
    .limit(limit)
    .lean();

export const attachAccount = (sessionId, userId) =>
  Session.updateOne({ _id: sessionId, account: null }, { account: userId });

// Accounts seen on the sessions of the projects the caller may read: the
// choices offered by the "person" filter.
export const accountsInScope = (projectScope) =>
  Session.find({ project_id: projectScope, account: { $ne: null } })
    .distinct("account");

export const list = ({ filter, skip, limit }) =>
  Session.find(filter)
    .populate({ path: "project_id", model: "Project", select: "_id libelle link" })
    .populate({ path: "account", model: "User", select: "_id firstname lastname email" })
    .select("+countError")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

export const count = (filter) => Session.countDocuments(filter);

// When a project first sent data, and when it last did: what the installation
// state of a project is read from.
export const firstStartedAt = async (projectId) =>
  (
    await Session.findOne({ project_id: projectId })
      .sort({ startedAt: 1 })
      .select("startedAt")
      .lean()
  )?.startedAt ?? null;

export const lastStartedAt = async (projectId) =>
  (
    await Session.findOne({ project_id: projectId })
      .sort({ startedAt: -1 })
      .select("startedAt")
      .lean()
  )?.startedAt ?? null;

export const countOfProject = (projectId) => Session.countDocuments({ project_id: projectId });

export const create = (payload) => Session.create(payload);

// Closes a session only if it belongs to the given project: the widget could
// otherwise end any session whose identifier it knew.
export const endInProject = (sessionId, projectId, endedAt) =>
  Session.findOneAndUpdate(
    { _id: sessionId, project_id: projectId },
    { endedAt },
    { new: true }
  ).lean();

export const visitorsByCountry = (projectIds) =>
  Session.aggregate([
    {
      $match: {
        project_id: { $in: projectIds },
        "metadata.localization.country": { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: "$metadata.localization.country",
        visit: { $sum: 1 },
        uniqueUsers: { $addToSet: "$user_id" },
      },
    },
  ]);

export const countDistinctVisitors = async (projectIds) =>
  (
    await Session.distinct("user_id", {
      project_id: { $in: projectIds },
      user_id: { $exists: true },
    })
  ).length;

// --- Maintenance --------------------------------------------------------------

export const findOpen = (limit) =>
  Session.find({ endedAt: null }).select("_id").limit(limit).lean();

export const bulkEnd = (updates) =>
  updates.length > 0 ? Session.bulkWrite(updates) : Promise.resolve(null);

export const deleteByIds = (ids) => Session.deleteMany({ _id: { $in: ids } });

// --- Human-readable identifier ------------------------------------------------

// Atomic counter behind "session-N". The previous version read the latest
// session and added one: two sessions created at the same moment received the
// same identifier.
export const nextSequence = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "session" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  ).lean();

  // First use on an existing database: start after the highest identifier
  // already issued, so numbering never goes backwards.
  if (counter.value === 1) {
    const latest = await Session.findOne({ uniqueId: /^session-\d+$/ })
      .sort({ createdAt: -1 })
      .select("uniqueId")
      .lean();
    const highest = latest ? Number(latest.uniqueId.split("-")[1]) || 0 : 0;
    if (highest > 0) {
      const seeded = await Counter.findOneAndUpdate(
        { _id: "session", value: 1 },
        { $set: { value: highest + 1 } },
        { new: true }
      ).lean();
      if (seeded) return seeded.value;
    }
  }
  return counter.value;
};
