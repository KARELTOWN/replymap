import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Project from "./Project.js";
import { sessionRequestErrors } from "../services/interceptRequest/interceptRequestService.js";
import _ from "lodash";

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


const Session = mongoose.model("Session", SessionSchema);
export default Session;
