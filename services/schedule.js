import moment from "moment";
import cron from "node-cron";
import Session from "../models/Session.js";
import Chunk from "../models/Chunk.js";
// Tâche pour expiré les sessions qui sont été créé il y a plus de 10 h,
// sans être expiré, à cause d'une possibl erreur

export const schedule_expired_session = cron.schedule(
  "*/1 * * * *",
  async () => {
    try {
      const thirtyMinutes = moment().subtract(30, "minutes").toDate();
      let sessions = await Chunk.distinct("session_id");
      await Session.deleteMany({
        _id: { $nin: sessions },
        startedAt: { $lt: thirtyMinutes },
      });

      const expired_sessions = await Chunk.aggregate([
        {
          $group: {
            _id: "$session_id",
            lastChunkAt: { $max: "$createdAt" },
          },
        },
        {
          $match: {
            lastChunkAt: { $lt: thirtyMinutes },
          },
        },
      ]);
      console.log("expired sessions", expired_sessions)
      console.log("thirtyMinutes", thirtyMinutes)

      const updates = expired_sessions.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { endedAt: item.lastChunkAt },
        },
      }));

      if (updates.length > 0) {
        await Session.bulkWrite(updates);
      }

      console.log("Expired session task executed");
    } catch (error) {
      console.log("Expired session schedule", error);
    }
  },
  { scheduled: true }
);
