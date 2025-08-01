import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Project from "./Project.js";
import User from "./User.js";

const SessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: SchemaTypes.ObjectId,
      ref: User,
    },
    project_id: {
      type: SchemaTypes.ObjectId,
      ref: Project,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
    },
    metadata: {
      type: Object,
      required: true,
    },
    //   "metadata": {
    //   "browser": "Chrome",
    //   "os": "Windows 10",
    //   "device": "desktop",
    //   "screen": {
    //     "width": 1920,
    //     "height": 1080
    //   }
    // }
  },
  {
    timestamps: true,
  }
);
SessionSchema.statics.count = async function () {
  return await this.countDocuments();
};

const Session = mongoose.model("Session", SessionSchema);
export default Session;
