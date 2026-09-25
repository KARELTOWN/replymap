import mongoose from "../config/mongodb.js";

// Named monotonic counters, incremented atomically with `$inc`.
// Used for human-readable identifiers such as "session-42".
const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model("Counter", CounterSchema);
export default Counter;
