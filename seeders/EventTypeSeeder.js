import EventType from "../models/EventType.js";
async function EventTypeSeeder() {
  try {
    let data = [
      // { libelle: "runtime_errors" },
      // { libelle: "unhandle_promise_rejection" },
      // { libelle: "request_errors" },
      // { libelle: "rage_click" },
      // { libelle: "page_view" },
      // { libelle: "scroll_issue" },
      // { libelle: "form_error" },
      // { libelle: "rebond" },
      { libelle: "performance_issues" },
    ];
    await EventType.insertMany(data);
    console.log("Types d'évenements insérées");
  } catch (error) {
    throw error;
  }
}
export default EventTypeSeeder;
