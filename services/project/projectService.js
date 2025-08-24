import Project from "../../models/Project.js";
import User from "../../models/User.js";
import { user_connect_projects } from "../../models/UserProject.js";
import { isAdmin } from "../../utils/util.js";

export default function projectService() {
  const getProjectScript = async (tracking_id, project_id) => {
    const protocol = process.env.ENVIRONMENT == "local" ? "http" : "https";
    return `<script src='${protocol}://${process.env.RECORD_HOST}:${process.env.RECORD_PORT}/record.js' defer type='module'></script><script id='rrweb-init' data-project='${project_id}'></script>`;
  };
  return { getProjectScript };
}

export const ProjectModelFilter = async (req, query, skip = 0, limit = 0) => {
  let admin = await isAdmin(req);
  let project_finder;
  if (admin) {
    project_finder = Project.find(query);
  } else {
    let project_list = await user_connect_projects(req);
    query._id = { $in: project_list };
    project_finder = Project.find(query);
  }

  let total_project = await Project.countDocuments(query);
  let projects;
  if (skip == 0 && limit == 0) {
    projects = await project_finder
      .populate({
        path: "created_by",
        model: User,
        select: "firstname lastname",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  } else {
    projects = await project_finder
      .populate({
        path: "created_by",
        model: User,
        select: "firstname lastname",
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  projects = projects.map((project) => {
    const p = project.toObject(); // conversion ici
    p.creator = String(p.created_by._id) === String(req.user._id);
    return p;
  });

  return {
    total_project: total_project,
    project_list: projects,
  };
};
