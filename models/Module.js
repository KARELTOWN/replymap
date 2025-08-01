import mongoose from "../config/mongodb.js";
const ModuleSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Module = mongoose.model("Module", ModuleSchema);
export default Module;
