import EventType from "../models/EventType.js";
import Events from "../models/Events.js";
import { SUPPORTED_EVENT_TYPES } from "../shared/events/eventTypes.js";

// Reference data for tracked events.
//
// Only the types the widget actually sends are listed. `scroll_issue` and
// `rebond` were offered in the dashboard filters and never returned anything:
// nothing emitted them. A bounce is not an event either, it is a property of a
// session (one page seen, short, no interaction), computed from the sessions.
const EVENT_TYPES = SUPPORTED_EVENT_TYPES;

async function EventTypeSeeder() {
  for (const libelle of EVENT_TYPES) {
    await EventType.updateOne({ libelle }, { $setOnInsert: { libelle } }, { upsert: true });
  }

  // A type dropped from the list is removed, unless events were recorded with
  // it: history is never rewritten.
  const obsolete = await EventType.find({ libelle: { $nin: EVENT_TYPES } }).lean();
  for (const type of obsolete) {
    const used = await Events.exists({ type: type._id });
    if (!used) await EventType.deleteOne({ _id: type._id });
  }

  console.log("Event types seeded");
}

export default EventTypeSeeder;
