import _ from "lodash";
import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 } from "uuid";
import dbtransaction from "../utils/indexDB.js";
const { getEvents, saveEvents, deleteEventByKeys } = dbtransaction();

let performances = [];

const getPerformance = async () => {
  return await getEvents("replay_map_performance_issues");
};

const setPerformance = async (data) => {
  await saveEvents("replay_map_performance_issues", data);
};

export const observer = new PerformanceObserver(async (list) => {
  for (const entry of list.getEntries()) {
    if (
      (entry.entryType === "resource" || entry.entryType === "longtask") &&
      !isRecordResource(entry)
    ) {
      const timeToFetch = entry.responseEnd - entry.fetchStart;
      const timeInSecond = timeToFetch / 1000;
      let entryType =
        entry.entryType === "resource" ? "Ressource" : "Tâche longue";
      if (timeInSecond >= 3) {
        let exist = await existPerformance(entry);
        if (exist === false) {
          let newPerformance = {
            type: "performance_issues",
            project: project_id,
            page_url: window.location.href,
            timestamp: Date.now(),
            data: {
              name: entry.name,
              duration: timeInSecond,
              type: entryType,
              slow:
                timeInSecond >= 3 && timeInSecond <= 5 ? "Lent" : "Très lent",
            },
            uniqueId: v4(),
          };
          performances.push(newPerformance);
          let performances_to_save = performances;
          performances = [];
          await setPerformance(performances_to_save);
          if (performances_to_save.length > 0) {
            storePerformance();
          }
        }
      }
    }
  }
});

const existPerformance = async (entry) => {
  const performances = await getPerformance();
  if (performances && performances.events_data.length > 0) {
    let exist = performances.events_data.find(
      (item) => item.data.name === entry.name
    );
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
    let data = await getPerformance();
    if (data && data.events_data.length > 0) {
      const response = await fetchPost("event/store", {
        events: data.events_data,
      });
      if (!response.ok) {
        throw new Error("Erreur d'enregistrement des problèmes de performance");
      } else {
        deleteEventByKeys("replay_map_performance_issues", data.events_keys);
      }
    }
  } catch (error) {
    throw new Error(error);
  }
}, 4000);

window.addEventListener("unload", async () => {
  const performances = await getPerformance();
  if (performances.events_data.length > 0) {
    navigator.sendBeacon(
      "event/store",
      JSON.stringify({ events: performances.events_data })
    );
    deleteEventByKeys(
      "replay_map_performance_issues",
      performances.events_keys
    );
  }
});
