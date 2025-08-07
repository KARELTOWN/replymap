import pug from "pug";
import { viewspath } from "../index.js";
import path from "path";
import { mailingJob } from "../jobs/queue.js";

const mailing = async (receiver, subject, template, params) => {
  try {
    params.fronturl = process.env.FRONT_URL;
    const templatePath = path.join(viewspath, template);
    const htmlContent = pug.renderFile(templatePath, params);
    let infos = {
      from: process.env.MAIL_FROM_NAME,
      to: receiver.email, // receiver email
      subject: subject, // Subject line
      html: htmlContent, // html body
      user_id: receiver.user_id || null,
      title: subject,
      content: htmlContent,
    };
    await mailingJob(infos);
    console.log("Message envoyé");
  } catch (error) {
    console.log("Erreur d'envoi du mail : " + error);
  }
};
export default mailing;
