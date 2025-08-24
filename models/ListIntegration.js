import mongoose from "../config/mongodb.js";
const ListIntegrationSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      sparse: true,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ListIntegration = mongoose.model(
  "ListIntegration",
  ListIntegrationSchema
);
export default ListIntegration;
