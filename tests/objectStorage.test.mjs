// Object storage on Cloudflare R2: how a file is linked, and what happens when
// the storage is not configured.
import test from "node:test";
import assert from "node:assert/strict";

process.env.R2_ENDPOINT = "https://account123.r2.cloudflarestorage.com";
process.env.R2_BUCKET = "bugreveal-test";
process.env.R2_ACCESS_KEY_ID = "test-key-id";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
delete process.env.R2_PUBLIC_URL;

const storage = await import("../services/files/objectStorage.js");

const KEY = "track_bug/project_66f0/1700000000000_abc.png";

test("a file is read through a signed link, valid for a limited time", async () => {
  const url = await storage.objectUrl(KEY);

  assert.ok(url.includes(encodeURIComponent(KEY).replace(/%2F/g, "/")), url);
  // Signed: the link carries its own credentials and expiry.
  assert.match(url, /X-Amz-Signature=/);
  assert.match(url, /X-Amz-Expires=3600/);
});

test("a public bucket domain is used as is, without a signature", async () => {
  process.env.R2_PUBLIC_URL = "https://files.bugreveal.com/";
  try {
    assert.equal(await storage.objectUrl(KEY), `https://files.bugreveal.com/${KEY}`);
  } finally {
    delete process.env.R2_PUBLIC_URL;
  }
});

test("an unconfigured storage says so instead of failing on the network", async () => {
  const endpoint = process.env.R2_ENDPOINT;
  delete process.env.R2_ENDPOINT;
  try {
    assert.equal(storage.isConfigured(), false);
    await assert.rejects(
      () => storage.putObject({ key: KEY, body: Buffer.from("x"), contentType: "image/png" }),
      /R2_ENDPOINT/
    );
  } finally {
    process.env.R2_ENDPOINT = endpoint;
  }
});
