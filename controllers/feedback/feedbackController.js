import { matchedData } from "express-validator";
import ApiResponse from "../../shared/http/apiResponse.js";
import { assertValid } from "../../middleware/errorHandler.js";
import { removeTempUploads } from "../../utils/util.js";
import feedbackService from "../../services/feedback/feedbackService.js";

const service = feedbackService();

// HTTP layer of the feedback module.
//
// A controller does four things and nothing else: check the request, read it,
// call one service method, return a response object. No branching on business
// rules, no database access, no message wording. As soon as a handler starts
// reasoning about the product, that reasoning belongs to the service.
//
// Access control runs before this file, in middleware/projectAccess.js, which
// also loads `req.project` and `req.feedback`.

export default function feedbackController() {
  const getFeedbackParams = async (req, res) => {
    const data = await service.getParameters();
    return ApiResponse.ok(res, { messageKey: "feedback.parametersFetched", data });
  };

  const storeFeedback = async (req, res) => {
    try {
      assertValid(req);
      const payload = matchedData(req);

      await service.submit({
        payload,
        author: req.user,
        file: req.files?.file ? req.files.file[0] : null,
        attachments: req.files?.attachments ?? [],
      });

      return ApiResponse.accepted(res, { messageKey: "feedback.created" });
    } catch (error) {
      // multer wrote the upload to disk before the request was rejected.
      removeTempUploads(req);
      throw error;
    }
  };

  // Feedback from someone without a BugReveal account, on a project that
  // accepts it. The project was already checked by the ingestion guard and by
  // `requireGuestFeedback`; the identity here is only an email, which is why
  // it is never trusted for anything but showing who wrote.
  const storeGuestFeedback = async (req, res) => {
    try {
      assertValid(req);
      const { guest_email: email, guest_name: name, ...payload } = matchedData(req);

      await service.submit({
        payload,
        guest: { email, name },
        file: req.files?.file ? req.files.file[0] : null,
        attachments: req.files?.attachments ?? [],
      });

      return ApiResponse.accepted(res, { messageKey: "feedback.created" });
    } catch (error) {
      removeTempUploads(req);
      throw error;
    }
  };

  const getFeedbackPerProject = async (req, res) => {
    assertValid(req);
    const { project_id: projectId, limit, author, start_date, end_date } = matchedData(req);

    const data = await service.getBoard({ projectId, limit, author, start_date, end_date });
    return ApiResponse.ok(res, { messageKey: "feedback.listed", data });
  };

  // Authors to offer in the filter of this project.
  const getFeedbackAuthors = async (req, res) => {
    assertValid(req);
    const { project_id: projectId } = matchedData(req);

    const data = await service.getAuthors(projectId);
    return ApiResponse.ok(res, { messageKey: "feedback.authorsListed", data });
  };

  const showFeedback = async (req, res) => {
    const data = await service.getDetail(req.feedback._id);
    return ApiResponse.ok(res, { messageKey: "feedback.fetched", data });
  };

  const updateFeedback = async (req, res) => {
    assertValid(req);

    await service.update({
      feedback: req.feedback,
      changes: matchedData(req),
      actorId: req.user._id,
    });

    return ApiResponse.ok(res, { messageKey: "feedback.updated" });
  };

  const deleteFeedback = async (req, res) => {
    await service.remove(req.feedback);
    return ApiResponse.ok(res, { messageKey: "feedback.deleted" });
  };

  const sendFeedbackToIntegration = async (req, res) => {
    assertValid(req);
    const { integration, list_id: listId } = matchedData(req);

    await service.sendToIntegration({ feedback: req.feedback, integration, listId });
    return ApiResponse.ok(res, { messageKey: "feedback.sentToIntegration" });
  };

  const getFeedbackHistory = async (req, res) => {
    const data = await service.getHistory(req.feedback._id);
    return ApiResponse.ok(res, { messageKey: "feedback.historyListed", data });
  };

  return {
    getFeedbackParams,
    storeFeedback,
    storeGuestFeedback,
    getFeedbackPerProject,
    getFeedbackAuthors,
    showFeedback,
    updateFeedback,
    deleteFeedback,
    sendFeedbackToIntegration,
    getFeedbackHistory,
  };
}
