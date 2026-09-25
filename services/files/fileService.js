import fs from "fs";
import { v4 } from "uuid";
import { getFileMetadata } from "../../helpers/helper.js";
import { putObject, getObject, objectUrl } from "./objectStorage.js";

// Files attached to feedback: screenshots, recordings and attachments.
//
// Where they are actually stored is objectStorage.js (Cloudflare R2). This
// module decides how a file is named, what is kept about it, and hands the
// rest of the application a link it can show.

// One folder per project, a timestamp and a random name: two files uploaded in
// the same second, with the same original name, never collide.
const storageKey = (file, projectId) => {
  const extension = file.originalname.split(".").pop();
  return `track_bug/project_${projectId}/${Date.now()}_${v4()}.${extension}`;
};

export default function fileService() {
  const uploadFileOnS3 = async (file, project_id) => {
    try {
      const key = await putObject({
        key: storageKey(file, project_id),
        body: file.buffer,
        contentType: file.mimetype,
      });
      const { name, type, size } = getFileMetadata(file);
      return { key, name, type, size };
    } catch (error) {
      console.error("File upload failed:", error);
      return null;
    }
  };

  // Returns as many records as files, or nothing: the caller refuses a partial
  // upload rather than storing a feedback with half its attachments.
  const uploadFilesOnS3 = async (files, project_id) => {
    try {
      return await Promise.all(files.map((file) => uploadFileOnS3(file, project_id)));
    } catch (error) {
      console.error("Attachment upload failed:", error);
      return null;
    }
  };

  const getURLFileFromS3 = (key, expiresIn) => objectUrl(key, expiresIn);

  // The bytes themselves, for the callers that have to send the file
  // elsewhere rather than link to it.
  const getFileFromS3 = (key) => getObject(key);

  const checkFolder = (folder) => {
    if (!fs.existsSync(folder)) {
      // creates every missing level; without recursive, only the first folder is created
      fs.mkdirSync(folder, { recursive: true });
    }
  };

  const readFileFromFolder = async (pathToFile) => {
    try {
      return fs.readFileSync(pathToFile);
    } catch (error) {
      throw new Error(error);
    }
  };

  const deleteFiles = (paths) => {
    for (const filePath of paths) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Temporary file removal failed:", error.message, "→", filePath);
      }
    }
  };

  return {
    uploadFileOnS3,
    getFileFromS3,
    uploadFilesOnS3,
    getURLFileFromS3,
    checkFolder,
    readFileFromFolder,
    deleteFiles,
  };
}
