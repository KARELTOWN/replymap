import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import { isAdmin } from "../utils/util.js";
import { user_connect_projects } from "./UserProject.js";
import Project from "./Project.js";
import Session from "./Session.js";
import EventType from "./EventType.js";
import _ from "lodash";

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

export const EventModelFilter = async (
  req,
  query,
  skip,
  limit,
  error = false
) => {
  let admin = isAdmin(req);
  let issue_finder;
  if (error) {
    let errorsType = await EventType.find({
      libelle: { $in: ["runtime_errors", "unhandle_promise_rejection"] },
    })
      .select("_id")
      .exec();
    errorsType = _.map(errorsType, "id");
    query.type = { $in: errorsType };
  }
  if (admin) {
    issue_finder = Events.find(query);
  } else {
    let project_list = await user_connect_projects(req);
    query.project = { $in: project_list };
    issue_finder = Events.find(query);
  }
  let total_issues = await Events.countDocuments(query);
  let issues_list = await issue_finder
    .populate([
      {
        path: "project",
        model: Project,
        select: "_id libelle",
      },
      {
        path: "session",
        model: Session,
        select: "_id",
      },
      {
        path: "type",
        model: EventType,
        select: "libelle",
      },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  return {
    total_issues: total_issues,
    issues_list: issues_list,
  };
};

const Events = mongoose.model("Events", EventsSchema);
export default Events;
