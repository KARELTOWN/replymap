import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
const FilesSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: [true, "La clé de fichier existe déjà"],
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    feedback_id: {
      type: SchemaTypes.ObjectId,
      ref: "Feedback",
    },
  },
  {
    timestamps: true,
  }
);

// Attachments are always read by feedback.
FilesSchema.index({ feedback_id: 1 });

const Files = mongoose.model("Files", FilesSchema);
export default Files;
