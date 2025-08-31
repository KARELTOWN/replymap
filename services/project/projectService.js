import Project from "../../models/Project.js";
import User from "../../models/User.js";
import { isAdmin } from "../../utils/util.js";
import notificationService from "../../services/notification/notificationService.js";
import UserProject from "../../models/UserProject.js";
const { sendMailNotification } = notificationService();

export default function projectService() {
  const getProjectScript = async (tracking_id, project_id) => {
    const protocol = process.env.ENVIRONMENT == "local" ? "http" : "https";
    return `<script src='${protocol}://${process.env.RECORD_HOST}:${process.env.RECORD_PORT}/record.js' defer type='module'></script><script id='rrweb-init' data-project='${project_id}'></script>`;
  };
  return { getProjectScript };
}

export const user_connect_projects = async (req) => {
  let admin = await isAdmin(req);
  if (admin) {
    return await UserProject.find({}).distinct("project_id").exec();
  } else {
    return await UserProject.find({
      user_id: req.user._id,
    })
      .distinct("project_id")
      .exec();
  }
};

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

export const user_in_projects = async (project_id) => {
  let user_projects = await UserProject.find({ project_id: project_id })
    .populate("user_id")
    .select("user_id")
    .exec();
  user_projects = user_projects.map((e) => e.user_id);
  return user_projects;
};

export const projectData = async (project_id) => {
  try {
    let project = await Project.findById(project_id)
      .populate({
        path: "created_by",
        model: User,
        select: "fistname lastname",
      })
      .exec();
    return project;
  } catch (err) {
    throw new Error(err);
  }
};

export const checkProjectExist = async (project_id) => {
  try {
    let exist = await Project.exists({ _id: project_id }).exec();
    return exist;
  } catch (err) {
    throw new Error(err);
  }
};

export const inviteUserNotification = async (project_id, invited) => {
  try {
    let project = await projectData(project_id);
    let params = {
      libelle: project.libelle,
      firstname: invited.firstname,
      lastname: invited.lastname,
    };

    let receiver = {
      firstname: invited.firstname,
      lastname: invited.lastname,
      email: invited.email,
      _id: invited._id,
    };
    await sendMailNotification({
      receivers: [{ ...receiver }],
      params: params,
      model_name: "AUP-I",
    });

    let users_in_project = await user_in_projects(project_id);
    let users = users_in_project.filter((e) => e._id !== invited._id);
    await sendMailNotification({
      receivers: users,
      params: params,
      model_name: "AUP",
    });
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

export const quitProjectNotification = async (project_id, user_quit_id) => {
  try {
    let user_quit = await User.findById(user_quit_id);
    let users_in_project = await user_in_projects(project_id);
    let project = await projectData(project_id);
    let params = {
      libelle: project.libelle,
      firstname: user_quit.firstname,
      lastname: user_quit.lastname,
    };

    let receiver = {
      firstname: user_quit.firstname,
      lastname: user_quit.lastname,
      email: user_quit.email,
      _id: user_quit._id,
    };

    await sendMailNotification({
      receivers: [{ ...receiver }],
      params: params,
      model_name: "QP-I",
    });

    await sendMailNotification({
      receivers: users_in_project,
      params: params,
      model_name: "QP",
    });
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

export const createProjectNotification = async (creator, libelle) => {
  try {
    console.log("createProjectNotification", creator);
    await sendMailNotification({
      receivers: [
        {
          firstname: creator.firstname,
          lastname: creator.lastname,
          email: creator.email,
          _id: creator._id,
        },
      ],
      params: { libelle: libelle },
      model_name: "CP",
    });
    return true;
  } catch (err) {
    throw new Error(err);
  }
};
