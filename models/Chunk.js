import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Session from "./Session.js";

const ChunkSchema = new mongoose.Schema(
  {
    session_id: {
      type: SchemaTypes.ObjectId,
      ref: Session,
      required: true,
    },
    storage_link: {
      type: String,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    recorded_at: {
      type: Date,
      default: Date.now,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: [true, "Chunk existant"],
    },
  },
  {
    timestamps: true,
  }
);

// Chunks are always read by session, and by date within a session (last
// chunk, paginated replay).
ChunkSchema.index({ session_id: 1, createdAt: -1 });

const Chunk = mongoose.model("Chunk", ChunkSchema);
export default Chunk;
