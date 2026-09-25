// In-memory Redis: enough for rate counters and revocation lists, without
// starting a server.
const store = new Map();

const isAlive = (entry) =>
  entry !== undefined && (entry.expiresAt === null || entry.expiresAt > Date.now());

export const redisClient = {
  async get(key) {
    const entry = store.get(key);
    if (!isAlive(entry)) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },
  async set(key, value, options = {}) {
    const existing = store.get(key);
    if (options.NX && isAlive(existing)) return null;
    const expiresAt = options.EX ? Date.now() + options.EX * 1000 : null;
    store.set(key, { value, expiresAt });
    return "OK";
  },
  async del(key) {
    return store.delete(key) ? 1 : 0;
  },
  async incr(key) {
    const entry = store.get(key);
    const current = isAlive(entry) ? Number(entry.value) : 0;
    const next = current + 1;
    store.set(key, {
      value: String(next),
      expiresAt: isAlive(entry) ? entry.expiresAt : null,
    });
    return next;
  },
  async expire(key, seconds) {
    const entry = store.get(key);
    if (!isAlive(entry)) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  },
  async ttl(key) {
    const entry = store.get(key);
    if (!isAlive(entry)) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  },
  async keys() {
    return [...store.keys()];
  },
  flush() {
    store.clear();
  },
};

export const redisGetKey = (key) => redisClient.get(key);
export const redisSetKey = async (key, data, expire = 3600) =>
  redisClient.set(key, JSON.stringify(data), { EX: expire });
export const redisDeleteKey = async (key) => redisClient.del(key);
export const redisDeleteMultipleKeys = async () => undefined;
export const redisDeleteAllkey = async () => undefined;
export default async function redisConnection() {
  return redisClient;
}
