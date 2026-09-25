import * as projectRepository from "../../repositories/projectRepository.js";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import * as eventRepository from "../../repositories/eventRepository.js";
import { accessibleProjectIds } from "../access/accessService.js";

// Dashboard overview figures.
//
// Two defects are fixed here. Visitor counts and the country breakdown were
// computed over every session in the database, whoever owned them: any account
// saw the traffic of every customer. And counts were obtained by loading every
// session and event into memory to read `.length`; they are now counted by the
// database.

export default function statService() {
  const getOverview = async (user) => {
    const projectIds = await accessibleProjectIds(user);
    const scope = { $in: projectIds };

    const [projects, sessions, events, byCountry, visitors] = await Promise.all([
      projectRepository.count({ _id: scope }),
      sessionRepository.count({ project_id: scope }),
      eventRepository.count({ project: scope }),
      sessionRepository.visitorsByCountry(projectIds),
      sessionRepository.countDistinctVisitors(projectIds),
    ]);

    return {
      projects_count: projects,
      sessions_count: sessions,
      events_count: events,
      user_country: byCountry,
      total_visit: visitors,
    };
  };

  return { getOverview };
}
