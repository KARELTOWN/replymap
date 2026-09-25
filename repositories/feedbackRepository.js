import mongoose from "../config/mongodb.js";
import Feedback from "../models/Feedback.js";
import Files from "../models/Files.js";
import FeedbackHistory from "../models/FeedbackHistory.js";
import FeedbackStatus from "../models/FeedbackStatus.js";
import FeedbackType from "../models/FeedbackType.js";

// Data access for the feedback module.
//
// This is the only layer allowed to import a Mongoose model. Services state
// *what* they need, repositories know *where* it lives and how it is queried.
// Two consequences worth keeping in mind:
//
//   - a query change (index, projection, aggregation) never reaches a service;
//   - services are testable without a database, by swapping this module.
//
// Repositories carry no business rule: no permission check, no orchestration,
// no throwing of AppError. They return plain data, or null.

const POPULATE_DETAIL = [
  { path: "type", model: "FeedbackType", select: "libelle" },
  { path: "session_id", model: "Session", select: "_id uniqueId" },
  { path: "status", model: "FeedbackStatus", select: "_id libelle" },
  { path: "file", model: "Files" },
  { path: "project_id", model: "Project", select: "_id libelle" },
  { path: "created_by", model: "User", select: "_id firstname lastname email" },
];

const POPULATE_LIST = [
  { path: "type", model: "FeedbackType", select: "libelle" },
  { path: "created_by", model: "User", select: "firstname lastname email" },
];

const LIST_FIELDS = [
  "type",
  "title",
  "description",
  "status",
  "created_by",
  // A guest feedback has no account behind it: without these two fields the
  // board would show it with no author at all.
  "guest_email",
  "guest_name",
  "integration",
  "integration_card_url",
  "createdAt",
  "updatedAt",
];

export const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

export const nextId = () => new mongoose.Types.ObjectId();

export const findById = (feedbackId) => Feedback.findById(feedbackId);

export const findDetailById = (feedbackId) =>
  Feedback.findById(feedbackId).populate(POPULATE_DETAIL).lean().exec();

export const findByProject = (filter, limit) =>
  Feedback.find(filter)
    .populate(POPULATE_LIST)
    .select(LIST_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

// The people who wrote on this project: the choices of the author filter.
export const authorsOfProject = (projectId) =>
  Feedback.find({ project_id: projectId, created_by: { $ne: null } }).distinct("created_by");

// The guests who wrote on this project, identified by their email alone.
export const guestAuthorsOfProject = (projectId) =>
  Feedback.find({ project_id: projectId, guest_email: { $ne: null } }).distinct("guest_email");

export const findByCardId = (cardId, projectId) =>
  Feedback.findOne({ integration_card_id: cardId, project_id: projectId })
    .select("_id status")
    .lean()
    .exec();

export const create = (payload) => Feedback.create(payload);

export const updateById = (feedbackId, changes) =>
  Feedback.findByIdAndUpdate(feedbackId, changes, { new: true });

export const deleteById = (feedbackId) => Feedback.findByIdAndDelete(feedbackId);

export const countByProject = (projectId) =>
  Feedback.countDocuments({ project_id: projectId });

// --- Attachments -------------------------------------------------------------

export const findFiles = (feedbackId) =>
  Files.find({ feedback_id: feedbackId }).lean().exec();

export const findFileById = (fileId) => Files.findById(fileId).lean().exec();

export const createFile = (payload) => Files.insertOne(payload);

export const createFiles = (payloads) =>
  payloads.length > 0 ? Files.insertMany(payloads) : Promise.resolve([]);

export const deleteFiles = (feedbackId) => Files.deleteMany({ feedback_id: feedbackId });

// --- History -----------------------------------------------------------------

export const findHistory = (feedbackId, limit = 100) =>
  FeedbackHistory.find({ feedback_id: feedbackId })
    .populate({ path: "createdBy", model: "User", select: "firstname lastname" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

export const createHistoryEntries = (entries) =>
  entries.length > 0 ? FeedbackHistory.insertMany(entries) : Promise.resolve([]);

export const createHistoryEntry = (entry) => FeedbackHistory.create(entry);

export const deleteHistory = (feedbackId) =>
  FeedbackHistory.deleteMany({ feedback_id: feedbackId });

// --- Reference data -----------------------------------------------------------

export const findStatuses = () => FeedbackStatus.find().select("_id libelle").lean();

export const findTypes = () => FeedbackType.find().select("_id libelle").lean();

export const findTypeById = (typeId) => FeedbackType.findById(typeId).lean();
