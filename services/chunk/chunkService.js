import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { __dirname } from "../../index.js";
import Chunk from "../../models/Chunk.js";
import zlib, { gzip } from "zlib";
import _ from "lodash";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import fs from "fs";
import fileService from "../files/fileService.js";
const { checkFolder } = fileService();

// Fonction pour Uploader les fichiers event
// au format JSON sur S3
// et pour combiner ces derniers afin de recrréer des sections
export default function eventWorker() {
  const clientS3 = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const uploadChunksInJsonFileOnS3 = async (data, project_id) => {
    try {
      const fileContent = zlib.gzipSync(JSON.stringify(data.events));

      const params = {
        Bucket: process.env.AWS_BUCKET,
        ContentType: "application/json",
        Body: fileContent,
        Key: `track_bug/project_${project_id}/session_${
          data.session_id
        }/chunk_${Date.now()}.json.gz`,
        ContentEncoding: "gzip", // Important : indique que c'est du gzip
        Acl: "public-read",
      };
      const command = new PutObjectCommand(params);
      const save = await clientS3.send(command);
      if (save) {
        return params.Key;
      }
    } catch (err) {
      console.error("Erreur lors de l'upload JSON vers S3 :", err);
    }
  };

  const uploadChunksInJsonFileLocal = async (data, project_id) => {
    try {
      const content = zlib.gzipSync(JSON.stringify(data.events));

      let base_folder = path.join(__dirname, "storage/track_bug");

      let file_folder = `project_${project_id}/session_${data.session_id}`;
      let folder = path.join(base_folder, file_folder);
      checkFolder(folder);
      let filename = `chunk_${Date.now()}.json.gz`;

      const filePath = path.join(folder, filename);

      fs.writeFileSync(filePath, content);
      return filePath;
    } catch (err) {
      console.error("Erreur lors du zip de chunk:", err);
    }
  };

  // async function generatePresignedUrl(key) {
  //   const command = new GetObjectCommand({
  //     Bucket: process.env.AWS_BUCKET,
  //     Key: key,
  //   });
  //   const url = await getSignedUrl(clientS3, command, { expiresIn: 3600 }); // url valide 1h
  //   return url;
  // }

  function getPublicFileUrl(key, zone) {
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`;
  }

  const getSessionChunks = async (session_id, skip, limit) => {
    const chunks = await Chunk.find({
      session_id: session_id,
    })
      .sort({
        timestamp: 1,
      })
      .skip(skip)
      .limit(limit);
    let events = [];

    // Get chuck from S3 Storage
    for (const chunk of chunks) {
      let url_chunk = getPublicFileUrl(chunk.storage_link, "s3");
      const response = await fetch(url_chunk);
      if (!response.ok) {
        throw new Error("Impossible de reconstituer la session");
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        events.push(...data);
      }
    }
    return events;
  };

  const getSessionChunksLocal = async (session_id, skip, limit) => {
    const chunks = await Chunk.find({
      session_id: session_id,
    })
      .sort({
        timestamp: 1,
      })
      .skip(skip)
      .limit(limit);
    let events = [];

    // Get chunk from local storage
    for (const chunk of chunks) {
      // Lire le fichier compressé (Buffer)
      const compressed = fs.readFileSync(chunk.storage_link);

      // Décompresser avec gunzipSync
      const decompressed = zlib.gunzipSync(compressed);

      // Convertir en texte
      const jsonString = decompressed.toString();

      // Convertir en objet JavaScript
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        events.push(...data);
      }
    }
    return events;
  };
  return {
    uploadChunksInJsonFileOnS3,
    getSessionChunks,
    uploadChunksInJsonFileLocal,
    getSessionChunksLocal,
  };
}
