import moment from "moment";
import cron from "node-cron";
import * as sessionRepository from "../repositories/sessionRepository.js";
import * as chunkRepository from "../repositories/chunkRepository.js";

// Maintenance of recording sessions.
//
// A session stays "open" as long as the widget sends recording chunks. When the
// tab closes abruptly, nobody calls the end endpoint and the session stays open
// forever. This task closes it on the date of its last chunk, and deletes the
// sessions that never recorded anything.
//
// Hard rule: a session that owns at least one recording chunk is never deleted,
// and the chunks are what decides, never the flag alone.
//
// The previous version re-read the whole collection every minute:
// `Chunk.distinct("session_id")` loaded every existing session id into memory,
// then passed them as `$nin` to a delete. Past a few tens of thousands of
// sessions, the query exceeded MongoDB's 16 MB limit and the task failed
// silently. The aggregation, for its part, grouped every chunk ever recorded and
// rewrote every session, including those closed months ago.

// A closed session with no chunk recorded nothing: the tab was opened and
// left, or closed at once. It is deleted rather than kept as a zero-second
// line in the dashboard.
const CLOSED_EMPTY_AFTER_MINUTES = 3;

// An open session is given far longer. A chunk closes on 100 events or ten
// seconds, so a session being watched always has one within seconds; this
// window only catches the ones the widget abandoned without closing.
const OPEN_EMPTY_AFTER_MINUTES = 30;
const IDLE_AFTER_MINUTES = 3; // no new chunk: session finished
const BATCH_SIZE = 500; // caps the work of a single run

export const closeIdleSessions = async () => {
  const idleBefore = moment().subtract(IDLE_AFTER_MINUTES, "minutes").toDate();

  // Only sessions still open are examined, in batches: a small and stable set,
  // unlike the full history.
  const openSessions = await sessionRepository.findOpen(BATCH_SIZE);

  const updates = [];
  for (const session of openSessions) {
    const lastChunk = await chunkRepository.findLatestOfSession(session._id);
    if (!lastChunk || lastChunk.createdAt >= idleBefore) continue;

    updates.push({
      updateOne: {
        filter: { _id: session._id },
        update: { endedAt: lastChunk.createdAt },
      },
    });
  }

  await sessionRepository.bulkEnd(updates);
  return updates.length;
};

export const removeEmptySessions = async () => {
  const closedBefore = moment().subtract(CLOSED_EMPTY_AFTER_MINUTES, "minutes").toDate();
  const openBefore = moment().subtract(OPEN_EMPTY_AFTER_MINUTES, "minutes").toDate();

  // Sessions flagged as having recorded nothing. Looking only at open ones left
  // behind every session the widget had closed without a single chunk, shown in
  // the dashboard with a duration of zero; judging open ones as quickly deleted
  // sessions that were still being watched.
  const candidates = await sessionRepository.findWithoutRecording(
    { closedBefore, openBefore },
    BATCH_SIZE
  );

  const removable = [];
  for (const session of candidates) {
    // The flag is only a shortlist: the chunks themselves decide. A session
    // recorded before the flag existed heals itself here rather than being
    // deleted.
    if (await chunkRepository.sessionHasRecording(session._id)) {
      await sessionRepository.markRecording(session._id);
      continue;
    }
    removable.push(session._id);
  }

  if (removable.length === 0) return 0;
  const result = await sessionRepository.deleteByIds(removable);
  return result.deletedCount;
};

export const schedule_expired_session = cron.schedule(
  "*/1 * * * *",
  async () => {
    try {
      const closed = await closeIdleSessions();
      const removed = await removeEmptySessions();
      if (closed > 0 || removed > 0) {
        console.log(`Session maintenance: ${closed} closed, ${removed} empty removed`);
      }
    } catch (error) {
      console.error("Session maintenance", error);
    }
  },
  { scheduled: true }
);

