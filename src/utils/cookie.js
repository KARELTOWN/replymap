import { v4 as uuidV4 } from "uuid";
export default function setCookieUser() {
  let user_id = null;
  let first_visit = false;
  let cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("replay_map_visitor_id="));
  if (cookie) {
    let data = cookie.split("replay_map_visitor_id=");
    user_id = data[1];
    first_visit = false;
  } else {
    first_visit = true;
    let date = new Date();
    date.setTime(date.getTime() + 1000 * 60 * 60 * 24 * 365);
    user_id = uuidV4();
    document.cookie = `replay_map_visitor_id=${user_id}; expires=${date.toUTCString()}; SameSite=None; Secure`;
  }
  return { user: user_id, first_visit: first_visit };
}

export const getBugRevealToken = () =>
  JSON.parse(localStorage.getItem("bugreveal_record_app_user")) || null;

// A token the API refuses (expired after 2 h, or revoked at sign-out) is
// dropped, so the widget offers to sign in again.
export const clearBugRevealToken = () => localStorage.removeItem("bugreveal_record_app_user");