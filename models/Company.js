import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

const CompanySchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      unique: [true, "Le compagnie existe déjà"],
      sparse: true,
    },
    created_by: {
      type: SchemaTypes.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ libelle: 1, created_by: 1 }, { unique: true });
const Company = mongoose.model("Company", CompanySchema);

export default Company;
