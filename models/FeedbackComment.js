import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
const FeedbackCommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    feedback_id: {
      type: SchemaTypes.ObjectId,
      ref: "Feedback",
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const FeedbackComment = mongoose.model("FeedbackComment", FeedbackCommentSchema);
export default FeedbackComment;
