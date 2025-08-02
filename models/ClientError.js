import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
const ClientErrorSchema = new mongoose.Schema(
  {
    project: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
    },
    session: {
      type: SchemaTypes.ObjectId,
      ref: "Session",
    },
    timeStamp: {
      type: Date,
      required: true,
    },
    general: {
      type: Object,
    },
    response: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const ClientError = mongoose.model("ClientError", ClientErrorSchema);
export default ClientError;
