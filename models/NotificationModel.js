import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
const NotificationModelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    unique: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationModelSchema.statics.count = async function () {
  return await this.countDocuments();
};

const NotificationModel = mongoose.model(
  "NotificationModel",
  NotificationModelSchema
);
export default NotificationModel;
