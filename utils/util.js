import { inflate } from "pako";
import Role from "../models/Role.js";

export const isAdmin = async (req) => {
  let role = await Role.find({ _id: req.user._id }).exec();
  return role.libelle == "Administrateur";
};

const dataURLToBlob = (dataURL) => {
  const [header, base64] = dataURL.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
};

export const decompressPako = (req, res, next) => {

  const byteArrayFile = new Uint8Array(Object.values(req.body.file));

  const decompressed = inflate(byteArrayFile, { raw: true });

  const decodedFile = new TextDecoder().decode(decompressed);
  req.body.file = dataURLToBlob(decodedFile);

  let attachments = [];
  for (const attachment of req.body.attachments) {

    const byteArrayFile = new Uint8Array(Object.values(attachment));
    const arrayBase64Attachment = inflate(byteArrayFile, { raw: true });

    const decodedAttachment = new TextDecoder().decode(arrayBase64Attachment);

    let blob = dataURLToBlob(decodedAttachment);

    attachments.push(blob);
  }
  req.body.attachments = attachments;
  next();
};

export const encodePako = (req, res, next) => {
  const compressedBuffer = Buffer.from(req.body.events, "base64");
  const inflated = pako.inflate(compressedBuffer);
  const decoded = new TextDecoder().decode(inflated);
  const events = JSON.parse(decoded);
  req.body.events = events;
  next();
};
