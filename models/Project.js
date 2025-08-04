import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
import projectService from "../services/projectService.js";
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
    uniqueId: {
      type: String,
    },
    active_recording: {
      type: Boolean,
      default: true
    },
    active_track_errors: {
      type: Boolean,
      default: true
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

export const ProjectModelFilter = async (req, query, skip = 0, limit = 0) => {
  let admin = isAdmin(req);
  let project_finder;
  if (admin) {
    project_finder = Project.find(query);
  } else {
    let project_list = await user_connect_projects(req);
    query._id = { $in: project_list };
    project_finder = Project.find(query);
  }

  let total_project = await Project.countDocuments(query);
  let projects;
  if (skip == 0 && limit == 0) {
    projects = await project_finder
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  } else {
    projects = await project_finder.sort({ createdAt: -1 }).exec();
  }

  return {
    total_project: total_project,
    project_list: projects,
  };
};
ProjectSchema.index({ link: 1, created_by: 1 }, { unique: true });
const Project = mongoose.model("Project", ProjectSchema);
export default Project;
