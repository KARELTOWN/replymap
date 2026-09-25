import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

const FeedbackHistorySchema = new mongoose.Schema(
  {
    feedback_id: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: "Feedback",
    },
    description : {
      type: String,
      required: true
    },
    createdBy : {
      type: SchemaTypes.ObjectId,
      ref: "User",
      // Optional: a status change coming from the Trello webhook has no
      // BugReveal user behind it.
      default: null,
    },
    source: {
      type: String,
      enum: ["app", "trello"],
      default: "app",
    }
  },
  {
    timestamps: true,
  }
);

FeedbackHistorySchema.statics.count = async function () {
  return await this.countDocuments();
};

// Records a message together with the user
// Exemple : const feedback = new FeedbackHistory(req.body); await feedback.saveWithUser(req.user._id);

FeedbackHistorySchema.methods.saveWithUser = function (userId) {
  if (!this.createdBy) {
    this.createdBy = userId;
  }
  return this.save();
};

FeedbackHistorySchema.index({ feedback_id: 1, createdAt: -1 });

const FeedbackHistory = mongoose.model("FeedbackHistory", FeedbackHistorySchema);
export default FeedbackHistory;
