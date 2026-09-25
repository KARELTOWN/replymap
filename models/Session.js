import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Project from "./Project.js";
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
    // The visitor is anonymous while recording: `user_id` is a random
    // identifier kept in their browser. The account is known only once they
    // leave feedback, which requires being a member of the project; the
    // session is then attributed, so a replay can be found by person.
    // Set when the first recording chunk arrives. Maintenance can then find
    // the sessions that recorded nothing with one indexed query, closed ones
    // included: they used to be looked for among open sessions only, so a
    // session closed by the widget without a single chunk stayed forever.
    has_recording: {
      type: Boolean,
      default: false,
      index: true,
    },
    account: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
SessionSchema.statics.count = async function () {
  return await this.countDocuments();
};



// Periodic maintenance: sessions still open, oldest first.
SessionSchema.index({ endedAt: 1, startedAt: 1 });

const Session = mongoose.model("Session", SessionSchema);
export default Session;
