import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";
import Role from "./Role.js";
import Fonction from './Fonction.js'
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: [5, "Minimum 5 caractères"],
      maxlength: [15, "Maximum 15 caractères"],
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, "Cet email est déjà utilisé"],
      sparse: true, //Rend l'index unique applicable uniquement aux documents qui ont une valeur pour ce champ.
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    code: {
      type: String,
      default: "+229",
    },
    phone: {
      type: String,
    },
    role: {
      type: SchemaTypes.ObjectId,
      ref: Role,
      required: true, //Administrateur, Recruteur, Demandeur d'Emploi
    },
    fonction: {
      type: SchemaTypes.ObjectId,
      ref: Fonction,
      validate: {
        validator: async function (value) {
          const userRole = await Role.findById(this.role);
          if (!userRole) {
            return false;
          }
          if (userRole && userRole.libelle == "Administrateur") {
            return value !== null;
          } else {
            return value == null;
          }
        },
        message: (props) => {
          if (this.role && this.role.libelle == "Administrateur") {
            return "La fonction est obligatoire";
          } else {
            return `Seuls les administrateurs peuvent avoir une fonction.`;
          }
        },
      },
    },
    email_verified: {
      type: Boolean,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    // Instant every access token issued before becomes invalid. An access
    // token is a self-contained JWT: revoking the refresh tokens of an account
    // left its other tabs working until the 15 minutes were up, which is
    // exactly what "your other devices will be signed out" promises not to do.
    sessions_valid_from: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.statics.count = async function () {
  return await this.countDocuments()
};

// UserSchema.index({ code: 1, phone: 1 }, { unique: true });

const User = mongoose.model("User", UserSchema);
export default User;
