import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
const AppErrorSchema = new mongoose.Schema(
  {
    project: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
      required: true,
    },
    session: {
      type: SchemaTypes.ObjectId,
      ref: "Session",
    },
    timeStamp: {
      type: Date,
      required: true,
    },
    page_url: {
      type: String,
      required: true,
    },
    general: {
      type: Object,
      required: true,
    },
    response: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AppError = mongoose.model("AppError", AppErrorSchema);
export default AppError;
