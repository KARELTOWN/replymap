import User from "../models/User.js";

// Data access for user accounts.
//
// Services state which account they need and in which shape; this module knows
// that the password field is excluded by default and has to be asked for.

export const findById = (userId) =>
  User.findById(userId).select("_id email is_active email_verified").lean();

export const findByEmail = (email) => User.findOne({ email }).lean();

// The password is `select: false` on the schema: only the sign-in path asks
// for it, and it never leaves the service that compares it.
export const findByEmailWithPassword = (email) =>
  User.findOne({ email }).select("+password");

export const findProfile = (userId) =>
  User.findById(userId).select("_id firstname lastname email").lean();

export const create = (payload) => User.create(payload);

export const updateById = (userId, changes) =>
  User.findByIdAndUpdate(userId, changes, { new: true });

export const existsWithEmail = async (email) => Boolean(await User.exists({ email }));

export const existsWithUsername = async (username) => Boolean(await User.exists({ username }));

export const findByIdWithPassword = (userId) => User.findById(userId).select("+password");

export const setPassword = (userId, passwordHash) =>
  User.findByIdAndUpdate(userId, { password: passwordHash }, { new: true }).lean();

export const activate = (userId) =>
  User.findByIdAndUpdate(userId, { email_verified: true, is_active: true }, { new: true }).lean();

// The account attached to an authenticated request.
export const findSessionUser = (userId) =>
  User.findById(userId)
    .select(
      "_id firstname lastname email username role is_active email_verified sessions_valid_from"
    )
    .lean();

// Moves the line before which no access token is accepted any more.
export const setSessionsCutoff = (userId, date) =>
  User.updateOne({ _id: userId }, { sessions_valid_from: date });

export const findManyProfiles = (userIds) =>
  User.find({ _id: { $in: userIds } })
    .select("_id firstname lastname email")
    .sort({ firstname: 1 })
    .lean();
