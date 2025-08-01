import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Module from "./Module.js";
import Feature from "./Feature.js";
import Fonction from "./Fonction.js";
const PermissionSchema = new mongoose.Schema(
  {
    module_id: {
      type: SchemaTypes.ObjectId,
      ref: Module,
      required: true,
    },
    feature_id: {
      type: SchemaTypes.ObjectId,
      ref: Feature,
      required: true,
    },
    fonction_id: {
      type: SchemaTypes.ObjectId,
      ref: Fonction,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model("Permission", PermissionSchema);
export default Permission;
