import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
const UserProjectNotificationModelSchema = new mongoose.Schema(
  {
    notification_model: {
      type: SchemaTypes.ObjectId,
      ref: "NotificationModel",
      required: true,
    },
    user_project: {
      type: SchemaTypes.ObjectId,
      ref: "UserProject",
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

UserProjectNotificationModelSchema.statics.count = async function () {
  return await this.countDocuments();
};

const UserProjectNotificationModel = mongoose.model(
  "UserProjectNotificationModel",
  UserProjectNotificationModelSchema
);
export default UserProjectNotificationModel;
