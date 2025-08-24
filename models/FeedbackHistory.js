import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import { user_connect_events } from "./Events.js";

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
      required: true
    }
  },
  {
    timestamps: true,
  }
);

FeedbackHistorySchema.statics.count = async function () {
  return await this.countDocuments();
};

// Enregistrer un message avec l'utilisateur
// Exemple : const feedback = new FeedbackHistory(req.body); await feedback.saveWithUser(req.user._id);

FeedbackHistorySchema.methods.saveWithUser = function (userId) {
  if (!this.createdBy) {
    this.createdBy = userId;
  }
  return this.save();
};

const FeedbackHistory = mongoose.model("FeedbackHistory", FeedbackHistorySchema);
export default FeedbackHistory;
