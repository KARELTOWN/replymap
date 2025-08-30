// import { v4 as uuidv4 } from "uuid";
// import { elastiClient } from "../index.js";
import _ from "lodash";
import Events from "../../models/Events.js";
import EventType from "../../models/EventType.js";
import { isAdmin } from "../../utils/util.js";
import { user_connect_projects } from "../../models/UserProject.js";
import Project from "../../models/Project.js";
import Session from "../../models/Session.js";

export const createEventsLog = async (data) => {
  try {
    let events = [];
    for (const item of data) {
      const exist = await Events.exists({ uniqueId: item.uniqueId });
      if (exist) {
        continue;
      } else {
        if (item.session) {
          let session_exist = await Session.findById(item.session);
          if (!session_exist) {
            item.session = null;
          }
        }
        events.push(item);
      }
    }
    const result = await Events.insertMany(events);
    console.log("Events added successfully!");
    return true;
  } catch (error) {
    console.log("Erreur de création", error);
  }
};

export const EventModelFilter = async (
  req,
  query,
  skip,
  limit,
  error = false
) => {
  let admin = await isAdmin(req);
  let issue_finder;
  if (error === true && !query.type) {
    let errorsType = await EventType.find({
      libelle: {
        $in: ["runtime_errors", "unhandle_promise_rejection", "request_errors"],
      },
    })
      .select("_id")
      .exec();
    errorsType = _.map(errorsType, "_id");
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

  let issues = issue_finder.populate([
    {
      path: "project",
      model: Project,
      select: "libelle",
    },
    {
      path: "session",
      model: Session,
      select: "uniqueId",
    },
    {
      path: "type",
      model: EventType,
      select: "libelle",
    },
  ]);
  let issues_list = [];
  if (limit == 1000) {
    issues_list = await issues.sort({ createdAt: -1 }).exec();
  } else {
    issues_list = await issues
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  return {
    total_issues: total_issues,
    issues_list: issues_list,
  };
};
