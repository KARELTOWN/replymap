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
    events: {
      type: String,
    },
    timestamp: {
      type: Number,
      required: true,
    }, // utile pour l’ordre
    recorded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Chunk = mongoose.model("Chunk", ChunkSchema);
export default Chunk;
