import Events, { user_connect_events } from "../../models/Events.js";
import Project from "../../models/Project.js";
import Session, { user_connect_sessions } from "../../models/Session.js";
import { user_connect_projects } from "../../models/UserProject.js";

export default function statController() {
  const getStats = async (req, res) => {
    let projects = await user_connect_projects(req);
    const projects_count = projects.length;
    let sessions = await user_connect_sessions(req);
    const sessions_count = sessions.length;
    let events = await user_connect_events(req);
    const events_count = events.length;
    const user_country = await Session.aggregate([
      {
        $match: {
          "metadata.localization.country": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$metadata.localization.country",
          visit: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user_id" }, // récupérer les sessions d'utilisateurs distinct
        },
      },
    ]);

    let total_visit = await Session.distinct("user_id", {
      user_id: { $exists: true },
    }).exec();
    total_visit = total_visit.length;

    res.status(200).json({
      message: "Stats",
      data: {
        projects_count,
        sessions_count,
        events_count,
        user_country,
        total_visit,
      },
    });
  };

  return {
    getStats,
  };
}
