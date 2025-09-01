import { v4 as uuidV4 } from "uuid";
export default function setCookie() {
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

