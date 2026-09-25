import VerificationCode, { verificationType } from "../models/VerificationCode.js";

// Data access for the one-time codes that confirm an email address.

export const VERIFICATION_TYPES = verificationType;

export const create = (payload) => VerificationCode.create(payload);

// The most recent code still unused: a new registration attempt supersedes the
// previous one. Not filtered by type: codes stored before the schema fix have
// none.
export const findPending = (userId) =>
  VerificationCode.findOne({ user_id: userId, used_at: { $exists: false } }).sort({
    createdAt: -1,
  });

export const markUsed = (codeId) =>
  VerificationCode.updateOne({ _id: codeId }, { used_at: new Date() });
