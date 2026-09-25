import PasswordResetToken from "../models/PasswordResetToken.js";

// Data access for password reset links.
//
// `expires_at` is `select: false` on the schema: it is asked for explicitly,
// otherwise every link would look unexpired.

export const create = (payload) => PasswordResetToken.create(payload);

export const findPendingForUser = (userId) =>
  PasswordResetToken.findOne({ user_id: userId, used_at: { $exists: false } })
    .select("+expires_at")
    .sort({ createdAt: -1 });

export const findPendingByToken = (storedToken) =>
  PasswordResetToken.findOne({ token: storedToken, used_at: { $exists: false } }).select(
    "+expires_at"
  );

export const markUsed = (resetId) =>
  PasswordResetToken.updateOne({ _id: resetId }, { used_at: new Date() });

export const expireNow = (resetId) =>
  PasswordResetToken.updateOne({ _id: resetId }, { expires_at: new Date(Date.now() - 1000) });
