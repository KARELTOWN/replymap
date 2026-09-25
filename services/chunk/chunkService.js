import path from "path";
import { promises as fs } from "fs";
import zlib from "zlib";
import { promisify } from "util";
import { putObject } from "../files/objectStorage.js";
import { storagePath } from "../../shared/paths.js";
import * as chunkRepository from "../../repositories/chunkRepository.js";
import * as sessionRepository from "../../repositories/sessionRepository.js";
import { storeChunkJob } from "../../jobs/queue.js";
import { AppError } from "../../shared/errors/appError.js";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Storage of recording chunks.
//
// A chunk is a batch of rrweb events. Its events are written to a compressed
// file, and the chunk document only keeps a reference to that file. Replay
// reads the files back in order.
//
// File access is asynchronous: the previous version used readFileSync and
// gunzipSync inside the request, which froze the whole server while a long
// session was being loaded.

const LOCAL_ROOT = () => storagePath("track_bug");

const chunkFileName = () => `chunk_${Date.now()}.json.gz`;

export const writeChunkLocally = async (chunk, projectId) => {
  const content = await gzip(JSON.stringify(chunk.events));
  const folder = path.join(LOCAL_ROOT(), `project_${projectId}`, `session_${chunk.session_id}`);
  await fs.mkdir(folder, { recursive: true });

  const filePath = path.join(folder, chunkFileName());
  await fs.writeFile(filePath, content);
  return filePath;
};

// Kept for the day recordings move off the server's disk: the events are
// already compressed, so they go to object storage as they are.
export const writeChunkToStorage = (chunk, projectId) =>
  gzip(JSON.stringify(chunk.events)).then((body) =>
    putObject({
      key: `track_bug/project_${projectId}/session_${chunk.session_id}/${chunkFileName()}`,
      body,
      contentType: "application/json",
      contentEncoding: "gzip",
    })
  );

/**
 * Stores a chunk once. The widget retries on network failure, so the same chunk
 * can arrive several times: its uniqueId makes the operation idempotent.
 */
export const storeChunk = async (chunk, projectId) => {
  if (await chunkRepository.existsByUniqueId(chunk.uniqueId)) return false;

  const storageLink = await writeChunkLocally(chunk, projectId);
  await chunkRepository.create({ ...chunk, storage_link: storageLink });
  // The session has something to replay: maintenance must never delete it.
  await sessionRepository.markRecording(chunk.session_id);
  return true;
};

const readLocalChunk = async (storageLink) => {
  const decompressed = await gunzip(await fs.readFile(storageLink));
  const events = JSON.parse(decompressed.toString());
  return Array.isArray(events) ? events : [];
};

// Rebuilds the event stream of a session, one page of chunks at a time.
export const readSessionEvents = async ({ sessionId, skip, limit }) => {
  const chunks = await chunkRepository.findForReplay({
    sessionId,
    skip: Number(skip) || 0,
    limit: Number(limit) || 10,
  });

  // Files are read in parallel but concatenated in chunk order: replay needs
  // the events in the exact order they were recorded.
  const pages = await Promise.all(chunks.map((chunk) => readLocalChunk(chunk.storage_link)));
  return pages.flat();
};

/**
 * Accepts a batch from the widget and hands it to the queue.
 *
 * Every chunk must target a session of the project the guard attributed the
 * call to: otherwise a caller could write recordings into another project's
 * session. Checked in one query for the whole batch.
 */
export const enqueue = async ({ projectId, events }) => {
  const sessionIds = [...new Set(events.map((chunk) => String(chunk.session_id)))];
  const owned = await sessionRepository.countInProject(sessionIds, projectId);
  if (owned !== sessionIds.length) throw new AppError("NOT_FOUND");

  await storeChunkJob({ project_id: projectId, events });
  return { queued: events.length };
};

export default function chunkService() {
  return { storeChunk, readSessionEvents, writeChunkLocally, writeChunkToStorage, enqueue };
}
