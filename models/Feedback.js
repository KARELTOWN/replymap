import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

const FeedbackSchema = new mongoose.Schema(
  {
    type: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "FeedbackType",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // Feedback author. A member of the project leaves their account here; a
    // guest, allowed project by project, leaves only an email and a name. One
    // of the two is always present, which `guest_email` and this field
    // together guarantee.
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: null,
    },
    guest_email: {
      type: String,
      default: null,
      index: true,
    },
    guest_name: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
    },
    url: {
      type: String,
      index: true,
    },
    integration: {
      type: String,
      default: null,
    },
    integration_card_id: {
      type: String,
      default: null,
      index: true,
    },
    // Direct link to the card created in the external tool: tracking must be
    // able to jump to the task without searching for it.
    integration_card_url: {
      type: String,
      default: null,
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
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.statics.count = async function () {
  return await this.countDocuments();
};

FeedbackSchema.index({ project_id: 1, url: 1 });
// The board lists a project's feedback grouped by status and sorted by
// date: without this compound index, every board load forces a collection
// scan.
FeedbackSchema.index({ project_id: 1, status: 1, createdAt: -1 });
FeedbackSchema.index({ project_id: 1, createdAt: -1 });

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
