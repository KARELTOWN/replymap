import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";

const FeedbackSchema = new mongoose.Schema(
  {
    type: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "FeedbackType",
    },
    priority: {
      type: SchemaTypes.ObjectId,
      ref: "FeedbackPriority",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: Object,
    },
    project_id: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
      required: true,
    },
    session_id: {
      type: SchemaTypes.ObjectId,
      ref: "Session",
    },
    status: {
      type: SchemaTypes.ObjectId,
      ref: "FeedbackStatus",
      required: true,
    },
    file: {
      type: SchemaTypes.ObjectId,
      ref: "Files",
    },
    assignTo: {
      type: SchemaTypes.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.statics.count = async function () {
  return await this.countDocuments();
};

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
