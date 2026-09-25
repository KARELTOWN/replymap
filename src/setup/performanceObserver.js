import _ from "lodash";
import { project_id } from "../record";
import { fetchPost } from "../utils/request";
import { v4 } from "uuid";
import dbtransaction from "../utils/indexDB.js";
const { getEvents, saveEvents, deleteEventByKeys } = dbtransaction();
const backURL = `${import.meta.env.VITE_BACKEND_URL}`;

let performances = [];

const getPerformance = async () => {
  try {
    return await getEvents("replay_map_performance_issues");
  } catch (err) {
    console.warn("Erreur getPerformance", err);
  }
};

const setPerformance = async (data) => {
  try {
    await saveEvents("replay_map_performance_issues", data);
  } catch (err) {
    console.warn("Erreur setperformance", err);
  }
};

export const observer = new PerformanceObserver(async (list) => {
  let entries = list.getEntries();
  setTimeout(() => {
    processEntries(entries);
  }, 0);
});

// Only the calls the application makes itself. `longtask` used to be observed
// alongside: a long task carries neither `responseEnd` nor `fetchStart`, so its
// duration came out as NaN and `NaN >= 3` is false — not a single one was ever
// reported. Images, stylesheets and fonts are left out too: a slow logo is not
// what one comes looking for here.
const TRACKED_INITIATORS = { fetch: "Requête fetch", xmlhttprequest: "Requête XHR" };

const SLOW_AFTER_SECONDS = 3;
const VERY_SLOW_AFTER_SECONDS = 5;

const processEntries = async (entries) => {
  try {
    for (const entry of entries) {
      const entryType = TRACKED_INITIATORS[entry.initiatorType];
      if (entry.entryType === "resource" && entryType && !isRecordResource(entry)) {
        const timeToFetch = entry.responseEnd - entry.fetchStart;
        const timeInSecond = timeToFetch / 1000;
        if (timeInSecond >= SLOW_AFTER_SECONDS) {
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
                  timeInSecond <= VERY_SLOW_AFTER_SECONDS ? "Lent" : "Très lent",
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
  } catch (err) {
    console.error("Erreur processEntries", err);
  }
};

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

// send the events to the backend for storage
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
  try {
    const performances = await getPerformance();
    if (performances.events_data.length > 0) {
      const blob = new Blob(
        [JSON.stringify({ events: performances.events_data })],
        { type: "application/json" }
      );
      navigator.sendBeacon(`${backURL}/event/store`, blob);
      deleteEventByKeys(
        "replay_map_performance_issues",
        performances.events_keys
      );
    }
  } catch (err) {
    console.warn("Erreur unload performanceObserver", err);
  }
});
