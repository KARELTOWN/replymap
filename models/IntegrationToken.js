import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import moment from "moment";

const IntegrationTokenSchema = new mongoose.Schema(
  {
    project_id: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
      required: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    integration: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    board: {
      type: String,
      required: false,
    },
    webhook_id: {
      type: String,
      default: null,
    },
    status_mapping: {
      type: [
        {
          list_id: { type: String, required: true },
          status: {
            type: SchemaTypes.ObjectId,
            ref: "FeedbackStatus",
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

IntegrationTokenSchema.index(
  { project_id: 1, integration: 1, token: 1 },
  { unique: true, sparse: true }
);

IntegrationTokenSchema.methods.isExpired = function () {
  const now = moment();
  const expirationDate = moment(this.expiredAt);
  if (expirationDate.isSameOrAfter(now)) {
    return false;
  } else {
    return true;
  }
};

const IntegrationToken = mongoose.model(
  "IntegrationToken",
  IntegrationTokenSchema
);

export default IntegrationToken;
