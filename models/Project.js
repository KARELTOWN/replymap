import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
import projectService from "../services/project/projectService.js";
import { user_connect_projects } from "./UserProject.js";
import { isAdmin } from "../utils/util.js";
const { getProjectScript } = projectService();

const ProjectSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: true,
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: User,
      required: true,
    },
    link: {
      type: String,
      required: true,
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
    track: {
      // Activé l'enregistrement de session
      active_recording: {
        type: Boolean,
        default: true,
      },
      // Activé le suivi des erreurs : Erreurs de requêtes, erreurs javascript, erreurs de la console ...
      active_track_errors: {
        type: Boolean,
        default: true,
      },
      // Activé le suivi des événements: Rageclick, Rebond, Pages visités par sessions, etc ...
      active_event_issues: {
        type: Boolean,
        default: true,
      },
      // Activé le suivi des performances, pour détecter les requêtes qui prennent du temps (>= 1 seconde)
      active_performance_issues: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.statics.count = async function () {
  return await this.countDocuments();
};

ProjectSchema.pre("save", async function (next) {
  // Vérifie si tracking_code est vide (évite les doublons en update)
  if (!this.tracking_code) {
    this.tracking_code = await getProjectScript(this.tracking_id, this._id);
  }
  next();
});

ProjectSchema.index({ link: 1, created_by: 1 }, { unique: true });
const Project = mongoose.model("Project", ProjectSchema);
export default Project;
