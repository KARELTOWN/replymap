import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
const NotificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: User,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
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
