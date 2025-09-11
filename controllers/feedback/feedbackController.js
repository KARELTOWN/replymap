import { matchedData, validationResult } from "express-validator";
import FeedbackPriority from "../../models/FeedbackPriority.js";
import FeedbackType from "../../models/FeedbackType.js";
import Files from "../../models/Files.js";
import Feedback from "../../models/Feedback.js";
import FeedbackStatus from "../../models/FeedbackStatus.js";
import fileService from "../../services/files/fileService.js";
const { getURLFileFromS3 } = fileService();
import feedbackHistoryController from "./feedbackHistoryController.js";
import {
  storeFeedbackInIntegrationJob,
  storeFeedbackJob,
} from "../../jobs/queue.js";
import { checkSessionExist } from "../../services/session/sessionService.js";
const { storeFeedbackHistory } = feedbackHistoryController();
import feedbackService from "../../services/feedback/feedbackService.js";
const { feedbackData } = feedbackService();

export default function feedbackController() {
  const getFeedbackParams = async (req, res) => {
    try {
      res.status(200).json({
        message: "Paramètres de feedback récupérés",
        data: {
          type: await FeedbackType.find().select("libelle"),
          priority: await FeedbackPriority.find().select("libelle"),
          status: await FeedbackStatus.find().select("libelle"),
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const storeFeedback = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);

      // Vérif existence en base
      const session_exist = await checkSessionExist(data.session_id);
      if (!session_exist) {
        data.session_id = null;
      }

      const file = req.files.file ? req.files.file[0] : null;
      const attachments = req.files.attachments ? req.files.attachments : [];
      if (!file) {
        return res
          .status(422)
          .json({ message: "La capture d'écran est obligatoire" });
      }

      await storeFeedbackJob({
        file,
        feedback: data,
        attachments,
      });

      res.status(200).json({ message: "Feedback créé" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const storeFeedbackMember = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);

      // Vérif existence en base
      const session_exist = await checkSessionExist(data.session_id);
      if (!session_exist) {
        data.session_id = null;
      }

      const file = req.files.file ? req.files.file[0] : null;
      const attachments = req.files.attachments ? req.files.attachments : [];
      if (!file) {
        return res
          .status(422)
          .json({ message: "La capture d'écran est obligatoire" });
      }

      await storeFeedbackJob({
        file,
        feedback: data,
        attachments,
      });

      if (data.integration && data.list_id) {
        await storeFeedbackInIntegrationJob({
          file,
          feedback: data,
          attachments,
        });
      }

      res.status(200).json({ message: "Feedback créé" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getFeedbackPerProject = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);

    let status = await FeedbackStatus.find().exec();
    let feedBackPerProjet = [];
    let i = 0;
    for (const state of status) {
      feedBackPerProjet[i] = { status: null, feedbacks: [] };
      feedBackPerProjet[i].status = state;
      let feedbacks = await Feedback.find({
        status: state._id,
        project_id: data.project_id,
      })
        .populate([
          {
            path: "type",
            model: "FeedbackType",
            select: "libelle",
          },
          {
            path: "priority",
            model: "FeedbackPriority",
            select: "libelle",
          },
          {
            path: "assignTo",
            model: "User",
            select: "lastname firstname",
          },
        ])

        .select([
          "type",
          "priority",
          "title",
          "description",
          "assignTo",
          "createdAt",
          "updatedAt",
        ])
        .limit(50)
        .sort({ createdAt: -1 })
        .exec();
      feedBackPerProjet[i].feedbacks = feedbacks;
      i++;
    }

    res
      .status(200)
      .json({ message: "Feedbacks récupérés", data: feedBackPerProjet });
  };

  const showFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);

    let feedback = await feedbackData(data.feedback_id);

    feedback.file.key = await getURLFileFromS3(feedback.file.key);

    let files = await Files.find({ feedback_id: data.feedback_id });
    for (const file of files) {
      file.key = await getURLFileFromS3(file.key);
    }
    res.status(200).json({
      message: "Feedback récupéré",
      data: { feedback: feedback, files: files },
    });
  };

  const updateFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);

    let feedback = await Feedback.findByIdAndUpdate(data.feedback_id, data, {
      new: true,
    });

    await storeFeedbackHistory(data, feedback._id, req.user._id);

    res.status(200).json({
      message: "Feedback modifié",
    });
  };

  const assignFeedback = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);

    let feedback = await Feedback.findByIdAndUpdate(
      data.feedback_id,
      { assignTo: data.assignTo },
      {
        new: true,
      }
    );

    await storeFeedbackHistory(data, feedback._id, req.user._id);

    res.status(200).json({
      message: "Feedback assigné",
    });
  };

  return {
    getFeedbackParams,
    storeFeedback,
    getFeedbackPerProject,
    showFeedback,
    updateFeedback,
    assignFeedback,
    storeFeedbackMember,
  };
}
