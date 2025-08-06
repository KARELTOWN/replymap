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

  const uploadChunksInJsonFile = async (data, project_id) => {
    const fileContent = zlib.gzipSync(JSON.stringify(data.events));

    const params = {
      Bucket: process.env.AWS_BUCKET,
      ContentType: "application/json",
      Body: fileContent,
      Key: `track_bug/project_${project_id}/session_${data.session_id}/chunk_${Date.now()}.json.gz`,
      ContentEncoding: "gzip", // Important : indique que c'est du gzip
      Acl: "public-read",
    };
    try {
      const command = new PutObjectCommand(params);
      const save = await clientS3.send(command);
      if (save) {
        return params.Key;
      }
    } catch (err) {
      console.error("Erreur lors de l'upload JSON vers S3 :", err);
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

  function getPublicFileUrl(key) {
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`;
  }

  const getSessionChunks = async (session_id, skip, limit) => {
    const chunks = await Chunk.find({
      session_id: session_id,
    }).sort({
      timestamp: 1,
    }).skip(skip).limit(limit);
    let events = [];

    for (const chunk of chunks) {
      let url_chunk = getPublicFileUrl(chunk.events);
      console.log("url_chunk", url_chunk);
      const response = await fetch(url_chunk);
      console.log("response", response);
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
  return {
    uploadChunksInJsonFile,
    getSessionChunks,
  };
}
