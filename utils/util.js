import fs from "fs";

// multer writes files to disk before access checks run: when a request
// is rejected, those temporary files would stay on the server forever.
export const removeTempUploads = (req) => {
  const groups = req?.files
    ? Array.isArray(req.files)
      ? [req.files]
      : Object.values(req.files)
    : [];
  for (const group of groups) {
    for (const file of group || []) {
      if (!file?.path) continue;
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error("Temporary upload removal failed:", error.message);
      }
    }
  }
};
