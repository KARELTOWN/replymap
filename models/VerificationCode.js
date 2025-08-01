import moment from "moment";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
import { SchemaTypes } from "mongoose";
export const verificationType = {
  'register' : "REGISTER_EMAIL_VERIFICATION",
  'login' : "2FA_LOGIN_VERIFICATION"
}
const VerificationCodeSchema = new mongoose.Schema(
  {
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: User,
      required: true,
    },
    code: {
      type: String,
      validate: {
        validator: function (value) {
          if (value) {
            return value.length == 5;
          }

        },
        message: (props) => `${props.value} n'a pas 5 caractères`,
      },
    },
    expires_at: {
      type: Date,
    },
    used_at: {
      type: Date,
    },
    type: {
      enum: [verificationType.register, verificationType.login],
    },
  },
  {
    timestamps: true,
  }
);

VerificationCodeSchema.methods.isExpired = function () {
  const now = moment();
  const expirationDate = moment(this.expires_at);
  if (expirationDate.isSameOrAfter(now)) {
    return false;
  } else {
    return true;
  }
};

const VerificationCode = mongoose.model(
  "VerificationCode",
  VerificationCodeSchema
);

export default VerificationCode;
