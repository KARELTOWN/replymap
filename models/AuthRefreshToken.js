import { SchemaTypes } from "mongoose";
import mongoose from "../config/mongodb.js";

// A refresh token, stored as the SHA-256 hash of its value: a database dump
// does not hand out sessions.
//
// Rotation keeps the chain: a used token is revoked and points to the token
// that replaced it (`replaced_by`), which the grace period relies on.
const AuthRefreshTokenSchema = new mongoose.Schema(
  {
    user_id: { type: SchemaTypes.ObjectId, ref: "User", required: true, index: true },
    token_hash: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
    revoked_at: { type: Date, default: null },
    replaced_by: { type: SchemaTypes.ObjectId, default: null },
  },
  { timestamps: true }
);

// Expired tokens are deleted by MongoDB itself.
AuthRefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const AuthRefreshToken = mongoose.model("AuthRefreshToken", AuthRefreshTokenSchema);

export default AuthRefreshToken;
