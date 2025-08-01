import moment from "moment";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
import { SchemaTypes } from "mongoose";

const PasswordResetTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: User,
      required: true,
    },
    token: {
      type: String,
      unique: true,
      select: false
    },
    expires_at: {
      type: Date,
      select: false
    },
    used_at: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

PasswordResetTokenSchema.methods.isExpired = function () {
  const now = moment();
  const expirationDate = moment(this.expires_at);
  if (expirationDate.isSameOrAfter(now)) {
    return false;
  } else {
    return true;
  }
};

const PasswordResetToken = mongoose.model(
  "PasswordResetToken",
  PasswordResetTokenSchema
);
export default PasswordResetToken;
