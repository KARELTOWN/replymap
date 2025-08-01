import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
import projectService from "../services/projectService.js";
const { getProjectScript } = projectService();

const ProjectSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: true,
    },
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: User,
      required: true,
    },
    link: {
      type: String,
      required: true,
      unique: [true, "Le lien doit être unique"],
    },
    tracking_id: {
      type: String,
      unique: [true, "L'identifiant est unique"],
      required: true,
    },
    tracking_code: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    uniqueId: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

ProjectSchema.statics.count = async function () {
  return await this.countDocuments();
};

ProjectSchema.pre('save', async function (next) {
  // Vérifie si tracking_code est vide (évite les doublons en update)
  if (!this.tracking_code) {
    this.tracking_code = await getProjectScript(this.tracking_id, this._id);
  }
  next();
});

const Project = mongoose.model("Project", ProjectSchema);
export default Project;
