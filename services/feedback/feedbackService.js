import Feedback from "../../models/Feedback.js";
import Project from "../../models/Project.js";
import notificationService from "../notification/notificationService.js";
import { user_in_projects } from "../project/projectService.js";

const { sendMailNotification } = notificationService();
export default function feedbackService() {
  const createFeedbackNotification = async (feedback_id) => {
    try {
      let feedback = await feedbackData(feedback_id);
      const { project_id, type, priority, status, title, description } =
        feedback;

      let users_in_project = await user_in_projects(project_id._id);
      let params = {
        type: type.libelle,
        priority: priority ? priority.libelle : null,
        status: status.libelle,
        title,
        description,
        project: project_id.libelle,
      };
      console.log("createFeedbackNotification", users_in_project);
      await sendMailNotification({
        receivers: users_in_project,
        params: params,
        model_name: "AF",
      });
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };

  const updateFeedbackNotification = async (edit, feedback) => {
    try {
      let users_in_project = await user_in_projects(feedback.project_id._id);

      if (!edit.status) {
        edit.status = "";
      }
      if (!edit.type) {
        edit.type = "";
      }
      if (!edit.priority) {
        edit.priority = "";
      }
      if (!edit.assignTo) {
        edit.assignTo = "";
      }
      let params = { ...edit, title: feedback.title };

      await sendMailNotification({
        receivers: users_in_project,
        params: params,
        model_name: "MF",
      });
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };

  const feedbackData = async (feedback_id) => {
    try {
      let feedback = await Feedback.findOne({
        _id: feedback_id,
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
          {
            path: "session_id",
            model: "Session",
            select: "_id uniqueId",
          },
          {
            path: "status",
            model: "FeedbackStatus",
            select: "_id libelle",
          },
          {
            path: "file",
            model: "Files",
          },
          {
            path: "project_id",
            model: "Project",
            select: "_id libelle",
          },
        ])
        .exec();
      return feedback;
    } catch (err) {
      throw new Error(err);
    }
  };
  return {
    createFeedbackNotification,
    feedbackData,
    updateFeedbackNotification,
  };
}
