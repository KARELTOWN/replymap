// A search term becomes a literal match. Passed as is to `$regex`, it let a
// caller inject a pattern: an expensive one blocks the database.
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegex;
