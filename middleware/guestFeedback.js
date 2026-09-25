import * as projectRepository from "../repositories/projectRepository.js";
import { removeTempUploads } from "../utils/util.js";
import { AppError } from "../shared/errors/appError.js";

// Feedback from someone without a BugReveal account.
//
// Opening this is a decision of the project owner, project by project: the
// product rule stays that a feedback carries an identity, but on an open
// project that identity is only an email the visitor typed.
//
// The ingestion guard ran first and attributed the call to a project (active,
// known origin, within quota); this only reads the setting of that project.
export const requireGuestFeedback = async (req, res, next) => {
  try {
    const projectId = req.trackedProject?._id;
    const project = projectId ? await projectRepository.findById(projectId) : null;

    if (!project?.allow_guest_feedback) {
      // multer wrote the screenshot to disk before this check: a refusal must
      // not leave it behind.
      removeTempUploads(req);
      return next(new AppError("GUEST_FEEDBACK_CLOSED"));
    }

    return next();
  } catch (error) {
    removeTempUploads(req);
    return next(error);
  }
};

export default requireGuestFeedback;
