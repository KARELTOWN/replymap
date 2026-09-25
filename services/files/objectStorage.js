import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Object storage: Cloudflare R2, reached with the S3 API.
//
// R2 speaks S3, so the same SDK is used with an account endpoint and the
// region "auto". Everything that stores a file goes through this module:
// feedback screenshots and attachments (fileService) and recording chunks
// (chunkService), which each had their own client and credentials before.
//
// Files stay private. They are read through a signed link, valid for an hour,
// so a screenshot cannot be reached by guessing a URL. Setting R2_PUBLIC_URL
// (an r2.dev address or a custom domain) switches to plain public links,
// which means anyone holding the link can open the file.

const LINK_LIFETIME_SECONDS = 60 * 60;

export const bucket = () => process.env.R2_BUCKET;

const publicBase = () => (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

export const isConfigured = () =>
  Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );

// Built on each call rather than at import time: the environment is loaded
// before the first request, not before the first import.
const client = () => {
  if (!isConfigured()) {
    throw new Error(
      "Object storage is not configured: set R2_ENDPOINT, R2_BUCKET, " +
        "R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region: process.env.R2_REGION || "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

export const putObject = async ({ key, body, contentType, contentEncoding }) => {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentEncoding: contentEncoding,
    })
  );
  return key;
};

export const getObject = async (key) => {
  const object = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return {
    buffer: Buffer.from(await object.Body.transformToByteArray()),
    mimetype: object.ContentType || "application/octet-stream",
  };
};

export const deleteObject = (key) =>
  client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));

export const objectUrl = (key, expiresIn = LINK_LIFETIME_SECONDS) => {
  const base = publicBase();
  if (base) return Promise.resolve(`${base}/${key}`);

  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn,
  });
};
