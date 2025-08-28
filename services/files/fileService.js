import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { __dirname } from "../../index.js";
import _ from "lodash";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import fs from "fs";
import { getFileMetadata } from "../../helpers/helper.js";
import { v4 } from "uuid";

export default function fileService() {
  const clientS3 = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const uploadFileOnS3 = async (file, project_id) => {
    try {
      let name = v4();
      let extension = file.originalname.split(".").pop();
      const params = {
        Bucket: process.env.AWS_BUCKET,
        ContentType: file.mimetype,
        Body: file.buffer,
        Key: `track_bug/project_${project_id}/${Date.now()}_${name}.${extension}`,
        Acl: "public-read",
      };
      const command = new PutObjectCommand(params);
      const save = await clientS3.send(command);
      if (save) {
        let fileInfo = getFileMetadata(file);

        return {
          key: params.Key,
          name: fileInfo.name,
          type: fileInfo.type,
          size: fileInfo.size,
        };
      }
    } catch (err) {
      console.error("Erreur lors de l'upload JSON vers S3 :", err);
    }
  };

  const uploadFilesOnS3 = async (files, project_id) => {
    try {
      let data = [];
      for (let i = 0; i < files.length; i++) {
        let name = v4();
        let file = files[i];
        let extension = file.originalname.split(".").pop();
        const params = {
          Bucket: process.env.AWS_BUCKET,
          ContentType: file.mimetype,
          Body: file.buffer,
          Key: `track_bug/project_${project_id}/${Date.now()}_${name}.${extension}`,
          Acl: "public-read",
        };
        const command = new PutObjectCommand(params);
        let save = await clientS3.send(command);
        if (save) {
          let fileInfo = getFileMetadata(file);
          data[i] = {
            key: params.Key,
            name: fileInfo.name,
            type: fileInfo.type,
            size: fileInfo.size,
          };
        }
      }

      return data;
    } catch (err) {
      console.error("Erreur lors de l'upload JSON vers S3 :", err);
    }
  };

  function getPublicFileUrl(key) {
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`;
  }

  const getFileFromS3 = async (key) => {
    try {
      // Get chuck from S3 Storage
      let url = getPublicFileUrl(key, "s3");
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Impossible de récupérer le fichier depuis S3");
      }
      // Si tu attends un fichier binaire (image, PDF, etc.)
      const fileBlob = await response.blob();
      return fileBlob;
    } catch (error) {
      throw new Error("Erreur getFileFromS3 " + error);
    }
  };

  const getURLFileFromS3 = async (key) => {
    try {
      // Get chuck from S3 Storage
      let url = getPublicFileUrl(key, "s3");

      return url;
    } catch (error) {
      throw new Error("Erreur getFileFromS3 " + error);
    }
  };

  const checkFolder = (folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true }); // pour créer tous les niveaux de dossiers nécessaires . Sans recursive, seul le premier dossier (storage) sera créé
    }
  };

  const readFileFromFolder = async (pathToFile) => {
    try {
      const file = fs.readFileSync(pathToFile);
      return file;
    } catch (error) {
      throw new Error(error);
    }
  };

  const deleteFiles = (paths) => {
    try {
      for (const e of paths) {
        fs.unlink(e, (err) => {
          if (err) {
            console.error("Erreur suppression :", err.message);
          }
          console.log("🗑️ Fichier supprimé :", e);
        });
      }
    } catch (error) {
      throw new Error(error);
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
