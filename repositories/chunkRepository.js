import Chunk from "../models/Chunk.js";

// Data access for recording chunks (the metadata; the recorded events live in
// compressed files referenced by `storage_link`).

export const existsByUniqueId = (uniqueId) => Chunk.exists({ uniqueId });

export const create = (payload) => Chunk.create(payload);

export const findForReplay = ({ sessionId, skip, limit }) =>
  Chunk.find({ session_id: sessionId })
    .sort({ timestamp: 1 })
    .skip(skip)
    .limit(limit)
    .select("storage_link timestamp")
    .lean()
    .exec();

export const findLatestOfSession = (sessionId) =>
  Chunk.findOne({ session_id: sessionId })
    .select("createdAt")
    .sort({ createdAt: -1 })
    .lean();

export const sessionHasRecording = (sessionId) => Chunk.exists({ session_id: sessionId });
