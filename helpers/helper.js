// Multipart file names travel as UTF-8, but multer reads them as latin1:
// "télécharger.jpg" was stored as "tÃ©lÃ©charger.jpg".
export const decodeUploadName = (name = "") =>
  Buffer.from(name, "latin1").toString("utf8");

export const getFileMetadata = (file) => {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  return {
    name: decodeUploadName(file.originalname),
    type: file.mimetype,
    size: sizeInMB,
  };
};
