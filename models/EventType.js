import mongoose from "../config/mongodb.js";
const EventTypeSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      unique: [true, "Le type d'evenement existe déjà"],
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const EventType = mongoose.model("EventType", EventTypeSchema);
export default EventType;
