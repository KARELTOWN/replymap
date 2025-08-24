import mongoose from "../config/mongodb.js";
const FeedbackPrioritySchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      unique: [true],
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeedbackPriority = mongoose.model("FeedbackPriority", FeedbackPrioritySchema);
export default FeedbackPriority;
