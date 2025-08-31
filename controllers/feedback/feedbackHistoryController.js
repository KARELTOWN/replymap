import { matchedData, validationResult } from "express-validator";
import FeedbackHistory from "../../models/FeedbackHistory.js";
import FeedbackStatus from "../../models/FeedbackStatus.js";
import FeedbackType from "../../models/FeedbackType.js";
import FeedbackPriority from "../../models/FeedbackPriority.js";
import User from "../../models/User.js";
import feedbackService from "../../services/feedback/feedbackService.js";
const { updateFeedbackNotification, feedbackData } = feedbackService();
export default function feedbackHistoryController() {
  const storeFeedbackHistory = async (data, feedback, user_id) => {
    try {
      let description = "";
      let newData = [];
      let content = {};
      let feedback_data = await feedbackData(feedback);
      if (data.status) {
        let status = await FeedbackStatus.findById(data.status).exec();
        description = `Statut modifié à ${status.libelle}`;
        newData.push({
          description: description,
          feedback_id: feedback,
          createdBy: user_id,
        });
        content.status = description;
      }
      if (data.type) {
        let type = await FeedbackType.findById(data.type).exec();
        description = `Type modifié à ${type.libelle}`;
        newData.push({
          description: description,
          feedback_id: feedback,
          createdBy: user_id,
        });
        content.type = description;
      }
      if (data.priority) {
        let priority = await FeedbackPriority.findById(data.priority).exec();
        description = `Priorité modifiée à ${priority.libelle}`;
        newData.push({
          description: description,
          feedback_id: feedback,
          createdBy: user_id,
        });
        content.priority = description;
      }
      if (data.assignTo) {
        let user = await User.findById(data.assignTo).exec();
        description = `Assigné à ${user.firstname} ${user.lastname}`;
        newData.push({
          description: description,
          feedback_id: feedback,
          createdBy: user_id,
        });
        content.assignTo = description;
      }

      const history = await FeedbackHistory.insertMany(newData);
      await updateFeedbackNotification(content, feedback_data );
      return history;
    } catch (error) {
      throw new Error(error);
    }
  };

  const getFeedbackHistory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);
    let history = await FeedbackHistory.find({
      feedback_id: data.feedback_id,
    })
      .populate({
        path: "createdBy",
        model: User,
        select: "firstname lastname",
      })
      .sort({ createdAt: -1 });
    res.status(200).json({
      message: "Paramètres de feedback récupérés",
      data: history,
    });
  };

  return {
    storeFeedbackHistory,
    getFeedbackHistory,
  };
}
