import Role from "../models/Role.js";

export const isAdmin = async (req) => {
  let role = await Role.find({ _id: req.user._id }).exec();
  return role.libelle == "Administrateur";
};
