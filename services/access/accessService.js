import mongoose from "../../config/mongodb.js";
import * as projectRepository from "../../repositories/projectRepository.js";
import * as roleRepository from "../../repositories/roleRepository.js";
import { AppError } from "../../shared/errors/appError.js";

// Which projects an account may see.
//
// Every listing (sessions, events, projects, statistics) is scoped by this
// module, so the rule is written once. Two defects came from having it copied
// into each module:
//
//   - statistics aggregated the sessions of every customer, not only those of
//     the caller's projects;
//   - filtering a listing by project did not work for regular users: the scope
//     overwrote the requested project instead of intersecting with it.

const ADMIN_ROLE = "Administrateur";

export const isPlatformAdmin = async (user) => {
  if (!user?.role) return false;
  const role = await roleRepository.findById(user.role);
  return role?.libelle === ADMIN_ROLE;
};

export const accessibleProjectIds = async (user) =>
  (await isPlatformAdmin(user))
    ? projectRepository.allProjectIds()
    : projectRepository.projectIdsOfUser(user._id);

/**
 * Builds the project condition of a listing query.
 *
 * With a requested project, the result narrows to that project only if it is
 * accessible; otherwise it matches nothing rather than leaking another scope.
 */
export const projectScope = async (user, requestedProjectId = null) => {
  const accessible = await accessibleProjectIds(user);
  if (!requestedProjectId) return { $in: accessible };

  const allowed = accessible.some((id) => String(id) === String(requestedProjectId));
  return allowed ? { $eq: new mongoose.Types.ObjectId(String(requestedProjectId)) } : { $in: [] };
};

export const assertProjectAccess = async (user, projectId) => {
  if (!projectId) throw new AppError("PROJECT_NOT_FOUND");
  if (await projectRepository.isMember(user._id, projectId)) return;
  if (await isPlatformAdmin(user)) return;
  throw new AppError("PROJECT_NOT_MEMBER");
};

export default {
  isPlatformAdmin,
  accessibleProjectIds,
  projectScope,
  assertProjectAccess,
};
