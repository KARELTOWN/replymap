import AuthRefreshToken from "../models/AuthRefreshToken.js";

// Data access for refresh tokens. Tokens are looked up by the hash of their
// value, never by the value itself.

export const create = (payload) => AuthRefreshToken.create(payload);

export const findByHash = (tokenHash) => AuthRefreshToken.findOne({ token_hash: tokenHash }).lean();

export const markReplaced = (tokenId, successorId, at) =>
  AuthRefreshToken.updateOne({ _id: tokenId }, { revoked_at: at, replaced_by: successorId });

export const revokeById = (tokenId, at) =>
  AuthRefreshToken.updateOne({ _id: tokenId, revoked_at: null }, { revoked_at: at });

export const revokeAllForUser = (userId, at) =>
  AuthRefreshToken.updateMany({ user_id: userId, revoked_at: null }, { revoked_at: at });
