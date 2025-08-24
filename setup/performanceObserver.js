import _ from "lodash";
import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 } from "uuid";
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
    if (entry.entryType === "resource" && !isRecordResource(entry)) {
      const timeToFetch = entry.responseEnd - entry.fetchStart;
      const timeInSecond = timeToFetch / 1000;

      if (timeInSecond >= 2) {
        if (!existPerformance(entry)) {
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

const existPerformance = (entry) => {
  const performances = getPerformance();
  if (performances !== null) {
    let exist = performances.find((item) => item.data.name === entry.name);
    return exist === undefined ? false : true;
  }
  return false;
};

const isRecordResource = (entry) => {
  return entry.name.includes(`${import.meta.env.VITE_BACKEND_URL}`);
};

//envoyer les evenements vers le serveur backend pour stockage
const storePerformance = _.debounce(async () => {
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
}, 4000);

window.addEventListener("unload", () => {
  const performances = getPerformance();
  if (performances.length > 0) {
    navigator.sendBeacon(
      "event/store",
      JSON.stringify({ events: performances })
    );
    setPerformance([]);
  }
});
