import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import { isAdmin } from "../utils/util.js";
import Project from "./Project.js";

const UserProjectSchema = new mongoose.Schema(
  {
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: "User",
    },
    project_id: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
    },
  },
  {
    timestamps: true,
  }
);

UserProjectSchema.index({ user_id: 1, project_id: 1 }, { unique: true });
const UserProject = mongoose.model("UserProject", UserProjectSchema);

export const user_connect_projects = async (req) => {
  let admin = await isAdmin(req);
  if (admin) {
    return await UserProject.find({}).distinct("project_id").exec();
  } else {
    return await UserProject.find({
      user_id: req.user._id,
    })
      .distinct("project_id")
      .exec();
  }
};

export default UserProject;
