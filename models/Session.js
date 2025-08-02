import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Project from "./Project.js";
import User from "./User.js";
import { errorPerSession } from "../services/elasticLog.js";

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

// SessionSchema.post("find", async (sessions) => {
//   await Promise.all(
//     sessions.map(async (session) => {
//       session.countError = await errorPerSession(session._id);
//     })
//   );
// });

const Session = mongoose.model("Session", SessionSchema);
export default Session;
