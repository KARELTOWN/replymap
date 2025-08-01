import { configDotenv } from "dotenv";
import nodemailer from "nodemailer";
import pug from "pug";
import { viewspath } from "../index.js";
import path from "path";
import Notification from "../models/Notification.js";
import moment from "moment";
import User from "../models/User.js";
import Role from "../models/Role.js";
const transporter = nodemailer.createTransport({
  mailer: process.env.MAIL_MAILER,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const mailing = async (receiver, subject, template, params) => {
  try {
    params.fronturl = process.env.FRONT_URL;
    const templatePath = path.join(viewspath, template);
    const htmlContent = pug.renderFile(templatePath, params);
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM_NAME,
      to: receiver.email, // list of receivers
      subject: subject, // Subject line
      html: htmlContent, // html body
    });
    await Notification.create({
      email: receiver.email,
      user_id: receiver.user_id || null,
      title: subject,
      content: htmlContent,
      sendAt: moment().toDate(),
    });
    console.log("Message envoyé: %s", info.response);
  } catch (error) {
    console.log("Erreur d'envoi du mail : " + error);
  }
};

export const mailToAdmin = async (subject, template, params) => {
  try {
    let role_admin = await Role.findOne({ libelle: "Administrateur" });
    let users = await User.find({ role: role_admin._id });
    params.fronturl = process.env.FRONT_URL;
    const templatePath = path.join(viewspath, template);
    const htmlContent = pug.renderFile(templatePath, params);
    for (const user of users) {
      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM_NAME,
        to: user.email, // list of receivers
        subject: subject, // Subject line
        html: htmlContent, // html body
      });
      await Notification.create({
        email: user.email,
        user_id: user._id || null,
        title: subject,
        content: htmlContent,
        sendAt: moment().toDate(),
      });
      console.log(`Message envoyé à ${receiver.email} : %s`, info.response);
    }
  } catch (error) {
    console.log("Erreur d'envoi du mail : " + error);
  }
};

export default mailing;
