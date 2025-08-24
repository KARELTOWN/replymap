import mongoose from "../config/mongodb.js";
const FeedbackTypeSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      unique: [true, "Le type de rapport existe déjà"],
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeedbackType = mongoose.model("FeedbackType", FeedbackTypeSchema);
export default FeedbackType;
