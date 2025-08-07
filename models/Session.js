import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Project from "./Project.js";
import User from "./User.js";
import { errorPerSession } from "../services/interceptRequest/interceptRequestService.js";
import { isAdmin } from "../utils/util.js";
import { user_connect_projects } from "./UserProject.js";

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

// SessionSchema.post("find", async (sessions) => {
//   await Promise.all(
//     sessions.map(async (session) => {
//       session.countError = await errorPerSession(session._id);
//     })
//   );
// });

export const SessionModelFilter = async (req, query, skip, limit) => {
  let admin = isAdmin(req);
  let session_finder;
  if (admin) {
    session_finder = Session.find(query);
  } else {
    let project_list = await user_connect_projects(req);
    query.project_id = { $in: project_list };
    session_finder = Session.find(query);
  }
  let total_session = await Session.countDocuments(query);
  let sessions = await session_finder
    .populate({
      path: "project_id",
      model: Project,
      select: "_id libelle link",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  return {
    total_session: total_session,
    session_list: sessions,
  };
};

const Session = mongoose.model("Session", SessionSchema);
export default Session;
