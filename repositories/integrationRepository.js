import IntegrationToken from "../models/IntegrationToken.js";

// Data access for integration tokens.
//
// Only this module knows that a connection is stored as a token document with
// an expiry date, a board and a status mapping. Services ask for "the active
// connection of this project" and get it, or null.

// Evaluated on every call: computed once at module load, the cut-off would
// freeze at server start and keep expired tokens "active" indefinitely.
const activeFilter = () => ({ expiredAt: { $gt: new Date() } });

export const findActive = (projectId, integration) =>
  IntegrationToken.findOne({
    project_id: projectId,
    integration,
    ...activeFilter(),
  });

export const findByBoard = (boardId, integration = "trello") =>
  IntegrationToken.findOne({ integration, board: boardId });

// The latest connection, expired or not.
export const findAny = (projectId, integration) =>
  IntegrationToken.findOne({ project_id: projectId, integration }).sort({ createdAt: -1 });

export const create = (payload) => IntegrationToken.create(payload);

export const save = (token) => token.save();
