import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

const EventsSchema = new mongoose.Schema(
  {
    type: {
      type: SchemaTypes.ObjectId,
      ref: "EventType",
      required: true,
    },
    session: {
      type: SchemaTypes.ObjectId,
      ref: "Session",
    },
    project: {
      type: SchemaTypes.ObjectId,
      ref: "Project",
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    page_url: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: [true, "Evenement existant"],
    },
  },
  {
    timestamps: true,
  }
);

const Events = mongoose.model("Events", EventsSchema);
export default Events;
