import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import User from "./User.js";
import { buildTrackingSnippet } from "../shared/tracking/trackingSnippet.js";

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
    // The websites this project actually receives data from, recorded as the
    // widget calls in. A project declares one domain, but the snippet is copied
    // by hand: it ends up on a staging site, a second domain, sometimes a site
    // it was never meant for. Only the host is kept, never a full address.
    installed_hosts: [
      {
        _id: false,
        host: { type: String, required: true },
        first_seen_at: { type: Date, default: Date.now },
        last_seen_at: { type: Date, default: Date.now },
        // False when the ingestion guard turned this host away: the data it
        // sent was refused, which is precisely what one wants to see here.
        accepted: { type: Boolean, default: true },
        // Switched off by hand from the project sheet. The script stays on the
        // website — one does not always have access to it — but it is told to
        // stop, and anything it still sends is refused.
        blocked: { type: Boolean, default: false },
      },
    ],
    // Whether someone without a BugReveal account may leave feedback on this
    // project. Off by default: opening it is a decision of the project owner,
    // who then accepts feedback identified only by an email.
    allow_guest_feedback: {
      type: Boolean,
      default: false,
    },
    track: {
      // Enables session recording
      active_recording: {
        type: Boolean,
        default: true,
      },
      // Enables error tracking: failed requests, JavaScript errors, console errors
      active_track_errors: {
        type: Boolean,
        default: true,
      },
      // Enables behaviour tracking: rage clicks, bounces, pages visited per session
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
  // Only when tracking_code is empty, to avoid regenerating it on update
  if (!this.tracking_code) {
    this.tracking_code = buildTrackingSnippet(this._id);
  }
  next();
});

ProjectSchema.index({ link: 1, created_by: 1 }, { unique: true });
const Project = mongoose.model("Project", ProjectSchema);
export default Project;
