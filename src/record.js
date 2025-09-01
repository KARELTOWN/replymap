import eventTracker from "./setup/eventTracker.js";
import interceptRequest from "./setup/interceptRequest.js";
import { observer } from "./setup/performanceObserver.js";
import initializeRecord from "./setup/recording.js";
import { getProject, isAppUser } from "./utils/project.js";
import dbtransaction from "./utils/indexDB.js";
import "./setup/bugreport/index.js";
const tableList = [
  "replay_map_record_events",
  "replay_map_events_tracker",
  "replay_map_performance_issues",
];
const { initDB } = dbtransaction();
export let project_id = null;
export const bugRevealUser = isAppUser();

async function initRecord() {
  try {
    const script = document.getElementById("rrweb-init");

    if (script) {
      project_id = script.dataset.project;
    } else {
      throw new Error("Impossible d'initialiser RETRY MAP");
    }

    await initDB(tableList);
    const res = await getProject(project_id);
    if (res?.status == "error") {
      throw new Error(res.message);
    } else if (res?.status == "success") {
      if (res.data.track.active_recording === true) {
        initializeRecord();
      }
      if (res.data.track.active_track_errors === true) {
        interceptRequest();
      }
      if (res.data.track.active_event_issues === true) {
        eventTracker();
      }
      if (res.data.track.active_performance_issues === true) {
        observer.observe({
          buffered: true,
          entryTypes: ["resource", "longtask"],
        });
      }
    }
  } catch (error) {
    console.log("Erreur record", error);
  }
}

await initRecord();
