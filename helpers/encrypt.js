import crypto from "crypto";
const key = Buffer.from(process.env.encrypted_key_hash, "hex"); // 32 bytes
const iv = Buffer.from(process.env.iv_key_hash, "hex");

export const encrypt = (data) => {
  const privateKey = data;
  if (key.length !== 32)
    throw new Error("Invalid key length (must be 32 bytes)");
  if (iv.length !== 16) throw new Error("Invalid IV length (must be 16 bytes)");

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
};

export let createTokenString = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  return resetToken;
};

export const decrypt = (data) => {
  if (key.length !== 32)
    throw new Error("Invalid key length (must be 32 bytes)");
  if (iv.length !== 16) throw new Error("Invalid IV length (must be 16 bytes)");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
