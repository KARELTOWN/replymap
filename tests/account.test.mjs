// Account lifecycle: sign-in, password reset. Regression tests for defects
// found while moving the rules from the auth controller into accountService.
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import validator from "validator";

import mongoose from "../config/mongodb.js";

// The encryption helper reads its keys at load time.
process.env.encrypted_key_hash ||= "0".repeat(64);
process.env.iv_key_hash ||= "0".repeat(32);
process.env.SECRET_KEY ||= "test-secret";
process.env.REFRESH_KEY ||= "test-refresh";

const { default: User } = await import("../models/User.js");
const { default: PasswordResetToken } = await import("../models/PasswordResetToken.js");
const { default: NotificationModel } = await import("../models/NotificationModel.js");
const { default: AuthRefreshToken } = await import("../models/AuthRefreshToken.js");
const { encrypt } = await import("../helpers/encrypt.js");
const { default: accountService } = await import("../services/auth/accountService.js");

const service = accountService();
const oid = () => new mongoose.Types.ObjectId();

// No email is rendered: the template lookup finds nothing.
NotificationModel.findOne = () => ({ lean: async () => null });

// Sessions opened and closed, without a database.
const revokedFor = [];
AuthRefreshToken.create = async (payload) => ({ _id: oid(), ...payload });
AuthRefreshToken.updateMany = async ({ user_id }) => revokedFor.push(String(user_id));

// --- In-memory accounts ---------------------------------------------------------

const accounts = new Map();
const addAccount = async ({ email, password, ...rest }) => {
  const account = {
    _id: oid(),
    email,
    firstname: "Ada",
    lastname: "Lovelace",
    email_verified: true,
    is_active: true,
    password: await bcrypt.hash(password, 4),
    ...rest,
  };
  accounts.set(String(account._id), account);
  return account;
};

const byEmail = (email) => [...accounts.values()].find((account) => account.email === email) ?? null;

User.findOne = ({ email }) => ({
  select: async () => byEmail(email),
  lean: async () => byEmail(email),
});
User.findById = (id) => ({
  select: async () => accounts.get(String(id)) ?? null,
  lean: async () => accounts.get(String(id)) ?? null,
});
User.findByIdAndUpdate = (id, changes) => ({
  lean: async () => {
    const account = accounts.get(String(id));
    if (!account) return null;
    Object.assign(account, changes);
    return account;
  },
});
// Closing every session also writes the cutoff before which no access token is
// accepted any more.
User.updateOne = async (filter, changes) => {
  const account = accounts.get(String(filter._id));
  if (account) Object.assign(account, changes);
  return { matchedCount: account ? 1 : 0 };
};
// The defective reset looked accounts up with `{ id: ... }`: a filter on a
// field that does not exist, so it matched whichever account came first.
User.findOneAndUpdate = async () => {
  throw new Error("findOneAndUpdate must not be used to reset a password");
};

const expectCode = async (promise) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error.code;
  }
};

// --- Sign-in --------------------------------------------------------------------

test("an unknown email and a wrong password get the same answer", async () => {
  await addAccount({ email: "known@example.com", password: "Str0ng!pass" });

  assert.equal(
    await expectCode(service.signIn({ email: "nobody@example.com", password: "Str0ng!pass" })),
    "AUTH_INVALID_CREDENTIALS"
  );
  assert.equal(
    await expectCode(service.signIn({ email: "known@example.com", password: "Wr0ng!pass" })),
    "AUTH_INVALID_CREDENTIALS"
  );
});

// --- Changing one's password ----------------------------------------------------

test("a wrong current password is not reported as a sign-in failure", async () => {
  const account = await addAccount({ email: "moi@example.com", password: "Str0ng!pass" });

  // "Email ou mot de passe incorrect" on a password change sent the person
  // looking for a mistake in an address they never typed.
  assert.equal(
    await expectCode(
      service.changePassword({
        user: account,
        currentPassword: "Wr0ng!pass",
        password: "N3w!password",
      })
    ),
    "AUTH_CURRENT_PASSWORD_INVALID"
  );

  assert.equal(
    await expectCode(
      service.changePassword({
        user: account,
        currentPassword: "Str0ng!pass",
        password: "Str0ng!pass",
      })
    ),
    "AUTH_PASSWORD_REUSED"
  );
});

test("the account state is only disclosed once the password matched", async () => {
  await addAccount({ email: "pending@example.com", password: "Str0ng!pass", email_verified: false });

  assert.equal(
    await expectCode(service.signIn({ email: "pending@example.com", password: "Wr0ng!pass" })),
    "AUTH_INVALID_CREDENTIALS"
  );
  assert.equal(
    await expectCode(service.signIn({ email: "pending@example.com", password: "Str0ng!pass" })),
    "AUTH_ACCOUNT_UNAVAILABLE"
  );
});

test("a password hashed escaped still signs in, and is rehashed as typed", async () => {
  const typed = "Str0ng&<pass>";
  const account = await addAccount({
    email: "legacy@example.com",
    password: validator.escape(typed),
  });

  const { session, reference } = await service.signIn({ email: "legacy@example.com", password: typed });
  assert.ok(session.accessToken && session.refreshToken && session.csrfToken && reference);
  assert.equal(await bcrypt.compare(typed, account.password), true);
});

// --- Password reset -------------------------------------------------------------

const pendingResets = new Map();
const addReset = (userId, { expired = false } = {}) => {
  const token = `${Math.random().toString(16).slice(2)}abcdef`;
  const reset = {
    _id: oid(),
    user_id: userId,
    token: encrypt(token),
    expires_at: new Date(Date.now() + (expired ? -60_000 : 60_000)),
    isExpired() {
      return this.expires_at < new Date();
    },
  };
  pendingResets.set(reset.token, reset);
  return token;
};

PasswordResetToken.findOne = ({ token }) => ({
  select: async () => pendingResets.get(token) ?? null,
});
PasswordResetToken.updateOne = async ({ _id }, changes) => {
  const reset = [...pendingResets.values()].find((entry) => String(entry._id) === String(_id));
  if (changes.used_at) pendingResets.delete(reset.token);
  else Object.assign(reset, changes);
};

test("a reset link changes the password of its own account only", async () => {
  const bystander = await addAccount({ email: "first@example.com", password: "Byst4nder!" });
  const owner = await addAccount({ email: "owner@example.com", password: "0ld!Passw" });
  const bystanderHash = bystander.password;

  const token = addReset(owner._id);
  await service.resetPassword({ token, password: "N3w!Passw" });

  assert.equal(await bcrypt.compare("N3w!Passw", owner.password), true);
  assert.equal(bystander.password, bystanderHash);

  // Whoever knew the old password is signed out everywhere.
  assert.deepEqual(revokedFor, [String(owner._id)]);

  // Used once, the link is gone.
  assert.equal(
    await expectCode(service.resetPassword({ token, password: "0ther!Pass" })),
    "AUTH_RESET_LINK_INVALID"
  );
});

test("an expired reset link is refused", async () => {
  const owner = await addAccount({ email: "late@example.com", password: "0ld!Passw" });
  const token = addReset(owner._id, { expired: true });

  assert.equal(
    await expectCode(service.resetPassword({ token, password: "N3w!Passw" })),
    "AUTH_RESET_LINK_EXPIRED"
  );
});

test("the new password must differ from the current one", async () => {
  const owner = await addAccount({ email: "same@example.com", password: "S4me!Passw" });
  const token = addReset(owner._id);

  assert.equal(
    await expectCode(service.resetPassword({ token, password: "S4me!Passw" })),
    "AUTH_PASSWORD_REUSED"
  );
});

test("a reset request answers the same whether or not the email has an account", async () => {
  assert.equal(await service.requestPasswordReset({ email: "ghost@example.com" }), null);
});
