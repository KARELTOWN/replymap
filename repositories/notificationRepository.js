import Notification from "../models/Notification.js";
import NotificationModel from "../models/NotificationModel.js";

// Data access for sent notifications and their templates.

export const findTemplate = (unique) => NotificationModel.findOne({ unique }).lean();

export const listForUser = ({ userId, skip, limit }) =>
  Notification.find({ mail_to: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

export const countForUser = (userId) => Notification.countDocuments({ mail_to: userId });

export const create = (payload) => Notification.create(payload);
