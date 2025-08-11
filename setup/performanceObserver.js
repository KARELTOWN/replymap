import _ from "lodash";
import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 } from "uuid";
let speed = 0;
let performances = [];
const getPerformance = () => {
  return JSON.parse(localStorage.getItem("replay_map_performance_issues"));
};
const setPerformance = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    localStorage.setItem("replay_map_performance_issues", JSON.stringify(data));
  } else {
    localStorage.removeItem("replay_map_performance_issues");
  }
};
export const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === "resource") {
      const timeToFetch = entry.responseEnd - entry.fetchStart;
      const timeInSecond = timeToFetch / 1000;

      if (timeInSecond >= 1) {
        let exist = performances.find((item) => item?.data?.name == entry.name);
        if (exist == undefined) {
          let newPerformance = {
            type: "performance_issues",
            project: project_id,
            page_url: window.location.href,
            timestamp: Date.now(),
            data: {
              name: entry.name,
              duration: timeInSecond,
            },
            uniqueId: v4(),
          };
          performances.push(newPerformance);
          setPerformance(performances);
          if (performances.length > 0) {
            storePerformance();
          }
        }
      }
    }
  });
});

//envoyer les evenements vers le serveur backend pour stockage
const storePerformance = async () => {
  try {
    let data = getPerformance();
    const response = await fetchPost("event/store", { events: data });
    if (!response.ok) {
      throw new Error("Erreur d'enregistrement des problèmes de performance");
    } else {
      performances = _.differenceWith(performances, data, _.isEqual);
      setPerformance(performances);
    }
  } catch (error) {
    throw new Error(error);
  }
};
