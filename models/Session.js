import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Project from "./Project.js";
import { sessionRequestErrors } from "../services/interceptRequest/interceptRequestService.js";
import _ from "lodash";
import { user_connect_projects } from "./UserProject.js";
import { isAdmin } from "../utils/util.js";

const SessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    first_visit: {
      type: Boolean,
      required: true,
      default: true,
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
    uniqueId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
SessionSchema.statics.count = async function () {
  return await this.countDocuments();
};

// SessionSchema.post("find", async (sessions) => {
//   if (Array.isArray(sessions)) {
//     for (const session of sessions) {
//       session.requestError = await sessionRequestErrors(session._id);
//     }
//   }
// });

export const user_connect_sessions = async (req) => {
  let admin = await isAdmin(req);
  if (admin) {
    return await Session.find({}).exec();
  } else {
    let projects = await user_connect_projects(req);
    return await Session.find({ project_id: { $in: projects } }).exec();
  }
};

const Session = mongoose.model("Session", SessionSchema);
export default Session;
