import { mailingJob } from "../../jobs/queue.js";
import { mailTransporter } from "../../config/mailer.js";
import * as notificationRepository from "../../repositories/notificationRepository.js";

// Email notifications: rendering of a stored template, and history of the
// notifications a user received.

// Template placeholders are written `#name`. Values come from users (feedback
// title, rich-text description): tags are dropped and the rest is escaped, so a
// submission can neither inject markup into the email nor show raw HTML.
const toSafeText = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const render = (template, params) =>
  Object.entries(params).reduce(
    (text, [key, value]) => text.split(`#${key}`).join(toSafeText(value)),
    template
  );

export default function notificationService() {
  const sendMailNotification = async ({ receivers, params, model_name: modelName }) => {
    const template = await notificationRepository.findTemplate(modelName);
    if (!template) {
      console.error("Notification template not found:", modelName);
      return false;
    }

    const subject = render(template.title, params);
    const html = render(template.content, params);

    await Promise.all(
      receivers
        .filter((receiver) => receiver?.email)
        .map((receiver) =>
          mailingJob({
            subject,
            html,
            to: receiver.email,
            user_id: receiver._id,
            model: template._id,
          })
        )
    );
    return true;
  };

  // A user only ever sees the notifications addressed to them. The previous
  // listing returned every email sent by the platform, to any account.
  const listForUser = async ({ user, pagination }) => {
    const { skip, limit, page } = pagination;
    const [notifications, total] = await Promise.all([
      notificationRepository.listForUser({ userId: user._id, skip, limit }),
      notificationRepository.countForUser(user._id),
    ]);
    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  };

  // Sends one queued email and keeps a trace of it for the recipient.
  const deliver = async ({ to, subject, html, user_id: userId, model }) => {
    const info = await mailTransporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });
    if (!info) return false;

    await notificationRepository.create({
      type: "email",
      mail_to: userId,
      title: subject,
      content: html,
      notification_model: model,
      sendAt: Date.now(),
    });
    return true;
  };

  return { sendMailNotification, listForUser, deliver };
}
