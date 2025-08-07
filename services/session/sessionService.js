import Session from "../../models/Session.js";
import { user_connect_projects } from "../../models/UserProject.js";
import { isAdmin } from "../../utils/util.js";

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