import { mailingJob } from "../../jobs/queue.js";
import NotificationModel from "../../models/NotificationModel.js";

export default function notificationService() {
  const sendMailNotification = async (data) => {
    try {
      const { receivers, params, model_name } = data;

      let model = await NotificationModel.findOne({
        unique: model_name,
      }).exec();
      let original_title = model.title;
      let original_content = model.content;

      let title_params = original_title;
      let content_params = original_content;

      Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`#${key}`, "g"); // remplace toutes les occurrences
        title_params = title_params.replace(regex, value);
        content_params = content_params.replace(regex, value);
      });

      for (const receiver of receivers) {
  
        let info = {
          firstname: receiver.firstname,
          lastname: receiver.lastname,
          email: receiver.email,
          _id: receiver._id,
        };

        let mailData = {
          subject: title_params,
          html: content_params,
          to: info.email,
          user_id: info._id,
          model: model._id
        };
        await mailingJob(mailData);
      }
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };
  return {
    sendMailNotification,
  };
}
