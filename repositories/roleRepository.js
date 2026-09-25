import Role from "../models/Role.js";

// Data access for platform roles.

export const findById = (roleId) => Role.findById(roleId).select("libelle").lean();

export const findByName = (libelle) => Role.findOne({ libelle }).lean();
