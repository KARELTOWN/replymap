export const getSessionId = () => {
  return JSON.parse(localStorage.getItem("track_bug_session_id")) || null;
};