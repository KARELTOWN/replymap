import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

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

export default UserProject;
