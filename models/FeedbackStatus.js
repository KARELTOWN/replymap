import mongoose from "../config/mongodb.js";
const FeedbackStatusSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      unique: [true, "Le status de feedback existe déjà"],
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeedbackStatus = mongoose.model("FeedbackStatus", FeedbackStatusSchema);
export default FeedbackStatus;
