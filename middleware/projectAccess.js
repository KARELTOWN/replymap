import mongoose from "../config/mongodb.js";
import * as projectRepository from "../repositories/projectRepository.js";
import * as feedbackRepository from "../repositories/feedbackRepository.js";
import { isPlatformAdmin } from "../services/access/accessService.js";
import { removeTempUploads } from "../utils/util.js";
import { AppError } from "../shared/errors/appError.js";

// Resource-level access control for the feedback module.
//
// `isauthentificate` only proves that a valid account exists. Without the check
// below, any BugReveal account could read or edit the feedback of a project it
// does not belong to, all the more since the project_id is public: it appears in
// clear in the tracking snippet injected on the customer's website.
//
// Two levels are exposed:
//
// - **contributing** (leaving feedback) requires project membership, without
//   exception: the MVP product rule is that feedback always comes from someone
//   the agency invited;
// - **reading / managing** (board, history, integrations) also accepts the
//   platform Administrator role, which already sees every project and session
//   elsewhere in the application.
//
// Refusals are AppErrors: the error middleware renders them in the caller's
// language, in the shared response envelope.

// multer runs before these checks (the multipart body is needed to read
// project_id): every rejection must therefore delete the files already written
// to disk, otherwise the temporary folder grows with each refused attempt.
const reject = (req, next, code) => {
  removeTempUploads(req);
  next(new AppError(code));
};

// A widget token is issued for one project: it opens nothing else, whatever
// else its account may be a member of.
const outsideWidgetProject = (req, project_id) =>
  Boolean(req.widgetSession) && String(req.widgetSession.projectId) !== String(project_id);

const readProjectId = (req) =>
  req.body?.project_id || req.query?.project_id || req.params?.project_id || null;

export const isProjectMember = async (user_id, project_id) => {
  if (!mongoose.Types.ObjectId.isValid(project_id)) return false;
  return projectRepository.isMember(user_id, project_id);
};

// The platform role is only queried when project membership failed: a regular member
// never pays for that extra read.
const canReachProject = async (req, project_id) => {
  if (await isProjectMember(req.user._id, project_id)) return true;
  return isPlatformAdmin(req.user);
};

const projectGuard = (allowPlatformAdmin) => async (req, res, next) => {
  try {
    const project_id = readProjectId(req);
    if (!project_id) return reject(req, next, "PROJECT_REQUIRED");
    if (!mongoose.Types.ObjectId.isValid(project_id)) {
      return reject(req, next, "PROJECT_INVALID");
    }

    const [project, allowed] = await Promise.all([
      projectRepository.findAccessInfo(project_id),
      allowPlatformAdmin
        ? canReachProject(req, project_id)
        : isProjectMember(req.user._id, project_id),
    ]);

    if (!project) return reject(req, next, "PROJECT_NOT_FOUND");
    if (!allowed || outsideWidgetProject(req, project_id)) {
      return reject(req, next, "PROJECT_NOT_MEMBER");
    }

    // The project is loaded once and for all: the controller does not have to
    // read it again behind the middleware.
    req.project = project;
    next();
  } catch (error) {
    removeTempUploads(req);
    next(error);
  }
};

const feedbackGuard = (allowPlatformAdmin) => async (req, res, next) => {
  try {
    const feedback_id = req.params?.feedback_id || req.body?.feedback_id;
    if (!feedback_id || !mongoose.Types.ObjectId.isValid(feedback_id)) {
      return reject(req, next, "FEEDBACK_INVALID");
    }

    const feedback = await feedbackRepository.findById(feedback_id);
    if (!feedback) return reject(req, next, "FEEDBACK_NOT_FOUND");

    const allowed = allowPlatformAdmin
      ? await canReachProject(req, feedback.project_id)
      : await isProjectMember(req.user._id, feedback.project_id);
    if (!allowed || outsideWidgetProject(req, feedback.project_id)) {
      return reject(req, next, "PROJECT_NOT_MEMBER");
    }

    req.feedback = feedback;
    next();
  } catch (error) {
    removeTempUploads(req);
    next(error);
  }
};

// Reading and managing a project: members and platform administrators.
export const requireProjectMember = projectGuard(true);

// Leaving feedback: project members only.
export const requireProjectContributor = projectGuard(false);

// Reading or updating an existing feedback.
export const requireFeedbackAccess = feedbackGuard(true);

// Writing to an existing feedback, members only.
export const requireFeedbackContributor = feedbackGuard(false);

export default requireProjectMember;
