import eventTracker from "./setup/eventTracker";
import interceptRequest from "./setup/interceptRequest";
import initializeRecord from "./setup/recording";
import { getProject } from "./utils/project";
export let project_id = null;
const script = document.getElementById("rrweb-init");

if (script) {
  project_id = script.dataset.project;
} else {
  throw new Error("Impossible d'initialiser RETRY MAP");
}
const res = await getProject(project_id);
if (res?.status == "error") {
  throw new Error(res.message);
} else if (res?.status == "success") {
  if (res.data.active_recording === true) {
    initializeRecord();
  }
  if (res.data.active_track_errors === true) {
    interceptRequest();
  }
  eventTracker();
}
