// The event types the widget actually records.
//
// The reference collection used to hold types nothing emitted (`scroll_issue`,
// `rebond`): they filled the dashboard filter and never returned a result. The
// list lives here so the seeder and the API cannot disagree.
export const SUPPORTED_EVENT_TYPES = [
  "runtime_errors",
  "unhandle_promise_rejection",
  "request_errors",
  "page_view",
  "form_submit",
  "form_error",
  "performance_issues",
];

// Types that belong to the path of a session, not to the event list. They are
// read as a flow on the session page — where the visitor went, and what they
// sent on the way — and listing them one by one alongside errors drowned it.
export const FLOW_EVENT_TYPES = ["page_view", "form_submit"];

export default SUPPORTED_EVENT_TYPES;
