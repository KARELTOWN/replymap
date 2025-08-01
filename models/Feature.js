import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Module from "./Module.js";
const FeatureSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: true,
    },
    module_id: {
      type: SchemaTypes.ObjectId,
      ref: Module,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


const Feature = mongoose.model("Feature", FeatureSchema);
export default Feature;
