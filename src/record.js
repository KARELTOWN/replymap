import eventTracker from "./setup/eventTracker.js";
import interceptRequest from "./setup/interceptRequest.js";
import { observer } from "./setup/performanceObserver.js";
import initializeRecord from "./setup/recording.js";
import { getProject } from "./utils/project.js";
import dbtransaction from "./utils/indexDB.js";
import initializeFeedbackWidget from "./setup/feedback/index.js";
const tableList = [
  "replay_map_record_events",
  "replay_map_events_tracker",
  "replay_map_performance_issues",
];
const { initDB } = dbtransaction();
export let project_id = null;

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
      // No await here: the feedback widget must not wait for the session to start
      // before showing up. `recordingHandlePromise` is resolved (through its
      // .rotateSession()) only when the widget actually needs it, after a feedback
      // submission.
      const track = res.data.track;

      let recordingHandlePromise = null;
      if (track.active_recording === true) {
        recordingHandlePromise = initializeRecord();
      }

      // Errors and slow requests stand on their own: they are collected even
      // when nothing is being recorded, and simply attach themselves to the
      // session when there is one. Behaviours describe a path inside a session:
      // they follow the recording switch instead of carrying one of their own,
      // which could only ever be a switch that does nothing.
      const trackErrors = track.active_track_errors === true;
      const trackBehaviours = track.active_recording === true;
      if (trackErrors) {
        interceptRequest();
      }
      if (trackErrors || trackBehaviours) {
        eventTracker({ errors: trackErrors, behaviours: trackBehaviours });
      }
      if (track.active_performance_issues === true) {
        observer.observe({ buffered: true, entryTypes: ["resource"] });
      }
      // The feedback widget is only initialised once project_id is confirmed valid
      // (active project + registered domain), so the backend endpoints are never
      // called with a null project_id and the domain check already done by
      // getProject() is honoured.
      initializeFeedbackWidget(recordingHandlePromise);
    }
  } catch (error) {
    console.log("Erreur record", error);
  }
}

await initRecord();
