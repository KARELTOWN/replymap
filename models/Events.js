import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

import _ from "lodash";
import { isAdmin } from "../utils/util.js";
import { user_connect_projects } from "./UserProject.js";

const EventsSchema = new mongoose.Schema(
  {
    type: {
      type: SchemaTypes.ObjectId,
      ref: "EventType",
      required: true,
    },
    session: {
      type: SchemaTypes.ObjectId,
      ref: "Session",
    },
    project: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
      required: true,
    },
    data: {
      type: SchemaTypes.Mixed,
      required: true,
    },
    page_url: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: [true, "Evenement existant"],
    },
  },
  {
    timestamps: true,
  }
);

export const user_connect_events = async (req) => {
  let admin = await isAdmin(req)
  if (admin) {
    return await Events.find({}).exec();
  } else {
    let projects = await user_connect_projects(req);
    return await Events.find({ project: { $in: projects } }).exec();
  }
};

const Events = mongoose.model("Events", EventsSchema);
export default Events;
