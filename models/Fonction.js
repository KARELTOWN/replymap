import mongoose from "../config/mongodb.js";
import { SchemaTypes } from "mongoose";
import Role from "./Role.js";

const FonctionSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: true,
    },
    role_id: {
      type: SchemaTypes.ObjectId,
      ref: Role,
      required: true,
    },
    is_unique: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Fonction = mongoose.model("Fonction", FonctionSchema);
export default Fonction;
