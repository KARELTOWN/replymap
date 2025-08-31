import Project from "../../models/Project.js";
import Session from "../../models/Session.js";
import { isAdmin } from "../../utils/util.js";
import { user_connect_projects } from "../project/projectService.js";

export const SessionModelFilter = async (req, query, skip, limit) => {
  let admin = await isAdmin(req)
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
    .select("+countError")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
  return {
    total_session: total_session,
    session_list: sessions,
  };
};

export const checkSessionExist = async (session) => {
  let exist = await Session.exists({ _id: session }).exec();
  return exist;
};


export const user_connect_sessions = async (req) => {
  let admin = await isAdmin(req);
  if (admin) {
    return await Session.find({}).exec();
  } else {
    let projects = await user_connect_projects(req);
    return await Session.find({ project_id: { $in: projects } }).exec();
  }
};