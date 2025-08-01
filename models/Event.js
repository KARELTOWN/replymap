import mongoose from "../config/mongodb.js";
import Session from "./Session.js";
import { SchemaTypes } from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    session_id: {
      type: SchemaTypes.ObjectId,
      ref: Session,
      required: true,
    },
    event_type: {
      type: String,
      required: true,
    },
    data: {
      type: SchemaTypes.Mixed,
      required: true
    },
    timestamp: { // temps en millisecondes
      type: Number,
      required: true,
    },
    page_url: {
      type: String,
    },
    page_title: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", EventSchema);
export default Event;
