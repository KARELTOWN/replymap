import Project from "../models/Project.js";
import UserProject from "../models/UserProject.js";

// Data access for projects and project membership.
//
// Membership lives in its own collection (UserProject): this module is the only
// one that knows it, so services speak of "members of a project" without
// caring how that relation is stored.

// --- Projects -----------------------------------------------------------------

export const findById = (projectId) => Project.findById(projectId).lean();

export const findTrackingInfo = (projectId) =>
  Project.findById(projectId).select("_id link active installed_hosts").lean();

// What the access guards keep on the request for the controllers.
export const findAccessInfo = (projectId) =>
  Project.findById(projectId).select("_id libelle active track").lean();

export const findPublicSettings = (projectId) =>
  Project.findById(projectId)
    .select("libelle link active track allow_guest_feedback installed_hosts")
    .lean();

// Websites seen sending data for this project.
export const findHosts = async (projectId) =>
  (await Project.findById(projectId).select("installed_hosts").lean())?.installed_hosts ?? [];

// Switches one website off, or back on. Reports whether that host was known.
export const setHostBlocked = async (projectId, host, blocked) =>
  (
    await Project.updateOne(
      { _id: projectId, "installed_hosts.host": host },
      { $set: { "installed_hosts.$.blocked": blocked } }
    )
  ).matchedCount > 0;

// Refreshes a host already known, and reports whether it was one.
export const touchHost = async (projectId, host, accepted, seenAt) =>
  (
    await Project.updateOne(
      { _id: projectId, "installed_hosts.host": host },
      {
        $set: {
          "installed_hosts.$.last_seen_at": seenAt,
          "installed_hosts.$.accepted": accepted,
        },
      }
    )
  ).matchedCount > 0;

// Adds a host never seen before. The list is capped: a snippet copied around,
// or a forged Origin, must not grow a project document without end.
export const addHost = (projectId, entry, cap) =>
  Project.updateOne(
    { _id: projectId },
    { $push: { installed_hosts: { $each: [entry], $slice: -cap } } }
  );

export const findOwner = (projectId) =>
  Project.findById(projectId).select("_id created_by").lean();

export const findWithCreator = (projectId) =>
  Project.findById(projectId)
    .populate({ path: "created_by", model: "User", select: "firstname lastname" })
    .lean();

export const exists = (projectId) => Project.exists({ _id: projectId });

export const existsWithLink = (link, creatorId) =>
  Project.exists({ link, created_by: creatorId });

// Uniqueness is checked among the projects of one owner: two agencies may
// track the same website without seeing each other's projects.
export const existsWithLinkElsewhere = (link, creatorId, excludedProjectId) =>
  Project.exists({ link, created_by: creatorId, _id: { $ne: excludedProjectId } });

export const existsWithNameElsewhere = (libelle, creatorId, excludedProjectId) =>
  Project.exists({ libelle, created_by: creatorId, _id: { $ne: excludedProjectId } });

export const list = ({ filter, skip = 0, limit = 0 }) => {
  const query = Project.find(filter)
    .populate({ path: "created_by", model: "User", select: "firstname lastname" })
    .sort({ createdAt: -1 });
  if (limit > 0) query.skip(skip).limit(limit);
  return query.lean().exec();
};

export const count = (filter) => Project.countDocuments(filter);

// `save()` is required rather than `create()`: the pre-save hook generates the
// tracking snippet.
export const create = async (payload) => {
  const project = new Project(payload);
  await project.save();
  return project;
};

export const updateById = (projectId, changes) =>
  Project.findByIdAndUpdate(projectId, { $set: changes }, { new: true }).lean();

// --- Membership ---------------------------------------------------------------

export const projectIdsOfUser = (userId) =>
  UserProject.find({ user_id: userId }).distinct("project_id").exec();

export const allProjectIds = () => UserProject.find({}).distinct("project_id").exec();

export const isMember = async (userId, projectId) =>
  Boolean(await UserProject.exists({ user_id: userId, project_id: projectId }));

export const addMember = (userId, projectId) =>
  UserProject.insertOne({ user_id: userId, project_id: projectId });

export const removeMember = (userId, projectId) =>
  UserProject.deleteMany({ user_id: userId, project_id: projectId });

export const membersOf = async (projectId, excludedUserId = null) => {
  const filter = { project_id: projectId };
  if (excludedUserId) filter.user_id = { $ne: excludedUserId };

  const rows = await UserProject.find(filter)
    .populate({ path: "user_id", model: "User", select: "firstname lastname _id email" })
    .select("user_id")
    .lean()
    .exec();
  return rows.map((row) => row.user_id).filter(Boolean);
};
