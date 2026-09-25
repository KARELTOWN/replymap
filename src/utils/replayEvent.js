import * as rrweb from "rrweb";

// Marking an event on the replay timeline.
//
// `rrweb.record.addCustomEvent` throws when rrweb is not recording ("please add
// custom event after start recording"). Every tracker called it *before*
// queueing the event it had to send: with session recording switched off, the
// exception cut the line just short of the send, and errors, failed requests
// and slow calls were silently lost — collections that have nothing to do with
// recording a replay.
//
// The mark is a bonus: it places the event inside the replay when there is one.
// Its absence must never cost the event itself.
export const addReplayEvent = (tag, payload) => {
  try {
    rrweb.record.addCustomEvent(tag, payload);
    return true;
  } catch {
    return false;
  }
};

export default addReplayEvent;
