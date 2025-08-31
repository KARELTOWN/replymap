import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
const NotifEnum = ["email", "autres"];

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: NotifEnum,
      required: true,
    },
    mail_to: {
      type: SchemaTypes.ObjectId,
      ref: "User",
    },
    send_to: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    notification_model: {
      type: SchemaTypes.ObjectId,
      ref: "NotificationModel",
      required: true,
    },
    sendAt: {
      type: Date,
      required: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.statics.count = async function () {
  return await this.countDocuments();
};

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
