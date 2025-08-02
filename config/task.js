import moment from "moment";
import cron from "node-cron";
import Session from "../models/Session.js";
import Chunk from "../models/Chunk.js";
// Tâche pour expiré les sessions qui sont été créé il y a plus de 10 h,
// sans être expiré, à cause d'une possibl erreur

export const schedule_expired_session = cron.schedule(
  "* */2 * * *",
  async () => {
    try {
      const twohours = moment().subtract(30, "minutes").toDate();
      let sessions = await Chunk.distinct("session_id");
      await Session.deleteMany({
        _id: { $nin: sessions },
        startedAt: { $lte: twohours },
      });
      await Session.updateMany(
        {
          endedAt: null,
          startedAt: { $lte: twohours },
        },
        { endedAt: Date.now() }
      );
      console.log("Expired session task executed");
    } catch (error) {
      console.log("Expired session schedule", error);
    }
  },
  { scheduled: true }
);
