import crypto from "crypto";
import bcrypt from "bcrypt";
import moment from "moment";
import validator from "validator";
import * as userRepository from "../../repositories/userRepository.js";
import * as roleRepository from "../../repositories/roleRepository.js";
import * as verificationCodeRepository from "../../repositories/verificationCodeRepository.js";
import * as passwordResetRepository from "../../repositories/passwordResetRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { encrypt, decrypt, createTokenString } from "../../helpers/encrypt.js";
import * as projectRepository from "../../repositories/projectRepository.js";
import { openSession, endAllSessions, issueWidgetToken } from "./authSessionService.js";
import authService from "./authService.js";

const {
  registerNotification,
  confirmRegisterNotification,
  forgotPasswordNotification,
  resetPasswordNotification,
} = authService();

// Account lifecycle: registration, email confirmation, sign-in, password reset.
//
// Rules that used to be spread over the auth validators and controller:
//
//   - sign-in answers the same error for an unknown email and a wrong
//     password, so the form cannot be used to probe which emails have an
//     account; the account state is only disclosed once the password matched;
//   - a password reset request answers the same message whether or not the
//     email has an account, for the same reason.

const DEFAULT_ROLE = "Utilisateur";
const BCRYPT_ROUNDS = 10;
const CODE_LIFETIME_HOURS = 1;
const RESET_LIFETIME_MINUTES = 30;

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

// Passwords used to go through `.escape()` in the validators before hashing:
// `a&b` was stored as the hash of `a&amp;b`. Such accounts still sign in, and
// their hash is replaced by the hash of the password actually typed.
const matchesPassword = async (user, password) => {
  if (!user?.password) return { matched: false };
  if (await bcrypt.compare(password, user.password)) return { matched: true, legacy: false };

  const escaped = validator.escape(password);
  if (escaped !== password && (await bcrypt.compare(escaped, user.password))) {
    return { matched: true, legacy: true };
  }
  return { matched: false };
};

const oneTimeCode = () => String(crypto.randomInt(0, 100000)).padStart(5, "0");

const uniqueUsername = async ({ firstname, lastname }) => {
  const letters = `${lastname}${firstname}`.replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
  for (;;) {
    const candidate = `@${letters.slice(0, 8)}${crypto.randomInt(0, 10000)}`;
    if (!(await userRepository.existsWithUsername(candidate))) return candidate;
  }
};

// The dashboard carries the account id encrypted between registration and
// confirmation. A tampered value simply does not decrypt.
const readAccountReference = (reference) => {
  try {
    return decrypt(reference);
  } catch {
    return null;
  }
};

const notifyInBackground = (label, promise) =>
  promise.catch((error) => console.error(`Notification failed (${label}):`, error));

export default function accountService() {
  const register = async ({ firstname, lastname, email, password }) => {
    if (await userRepository.existsWithEmail(email)) throw new AppError("AUTH_EMAIL_TAKEN");

    const role = await roleRepository.findByName(DEFAULT_ROLE);
    const user = await userRepository.create({
      firstname,
      lastname,
      email,
      password: await hashPassword(password),
      username: await uniqueUsername({ firstname, lastname }),
      role: role?._id,
    });

    const code = oneTimeCode();
    await verificationCodeRepository.create({
      user_id: user._id,
      code,
      type: verificationCodeRepository.VERIFICATION_TYPES.register,
      expires_at: moment().add(CODE_LIFETIME_HOURS, "hours").toDate(),
    });
    await registerNotification(user, code);

    return encrypt(user._id.toString());
  };

  const confirmRegistration = async ({ userReference, code }) => {
    const userId = readAccountReference(userReference);
    const user = userId ? await userRepository.findProfile(userId).catch(() => null) : null;
    if (!user) throw new AppError("AUTH_CODE_INVALID");

    const pending = await verificationCodeRepository.findPending(user._id);
    if (!pending || pending.code !== code) throw new AppError("AUTH_CODE_INVALID");
    if (pending.isExpired()) throw new AppError("AUTH_CODE_EXPIRED");

    await userRepository.activate(user._id);
    await verificationCodeRepository.markUsed(pending._id);
    notifyInBackground("account confirmed", confirmRegisterNotification(user));
    return null;
  };

  const signIn = async ({ email, password }) => {
    const user = await userRepository.findByEmailWithPassword(email);
    const { matched, legacy } = await matchesPassword(user, password);
    if (!matched) throw new AppError("AUTH_INVALID_CREDENTIALS");

    if (user.email_verified === false || user.is_active === false) {
      throw new AppError("AUTH_ACCOUNT_UNAVAILABLE");
    }
    if (legacy) await userRepository.setPassword(user._id, await hashPassword(password));

    return {
      session: await openSession(user),
      // Encrypted account reference, read by the dashboard.
      reference: encrypt(user._id.toString()),
    };
  };

  // --- Profile ---------------------------------------------------------------

  const profile = (user) => userRepository.findProfile(user._id);

  // The email is not editable: it identifies the account, carries the project
  // invitations and receives the reset links. Changing it needs a verification
  // of the new address, which the MVP does not do.
  const updateProfile = async ({ user, firstname, lastname }) => {
    const updated = await userRepository.updateById(user._id, { firstname, lastname });
    if (!updated) throw new AppError("USER_NOT_FOUND");
    return userRepository.findProfile(user._id);
  };

  /**
   * Changes the password of the signed-in account.
   *
   * Every other session is closed, because whoever knew the old password may
   * hold one. A fresh session is opened for the caller, so the tab making the
   * change is not signed out by its own action.
   */
  const changePassword = async ({ user, currentPassword, password }) => {
    const account = await userRepository.findByIdWithPassword(user._id);
    if (!account) throw new AppError("USER_NOT_FOUND");

    // Not AUTH_INVALID_CREDENTIALS: here the caller is already signed in and no
    // email is being checked. Answering "email ou mot de passe incorrect" on a
    // password change sent them looking for a mistake in an address they never
    // typed.
    if (!(await matchesPassword(account, currentPassword)).matched) {
      throw new AppError("AUTH_CURRENT_PASSWORD_INVALID");
    }
    if ((await matchesPassword(account, password)).matched) {
      throw new AppError("AUTH_PASSWORD_REUSED");
    }

    await userRepository.setPassword(account._id, await hashPassword(password));
    await endAllSessions(account._id);
    return openSession(account);
  };

  // Only a member may leave feedback on a project, so only a member gets a
  // widget session for it.
  const openWidgetSession = async ({ user, projectId }) => {
    if (!(await projectRepository.isMember(user._id, projectId))) {
      throw new AppError("PROJECT_NOT_MEMBER");
    }
    return issueWidgetToken(user._id, projectId);
  };

  // Unknown email, link already pending, link sent: the caller always gets the
  // same answer.
  const requestPasswordReset = async ({ email }) => {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;

    const pending = await passwordResetRepository.findPendingForUser(user._id);
    if (pending && !pending.isExpired()) return null;

    const token = createTokenString();
    await passwordResetRepository.create({
      user_id: user._id,
      token: encrypt(token),
      expires_at: moment().add(RESET_LIFETIME_MINUTES, "minutes").toDate(),
    });

    const link = `${process.env.FRONT_URL}/reset-password?urpi=${token}`;
    const reject = `${process.env.FRONT_URL}/desapprouve-reinitialisation?urpi=${token}`;
    await forgotPasswordNotification(user, link, reject);
    return null;
  };

  const findPendingReset = async (token) => {
    const reset = await passwordResetRepository.findPendingByToken(encrypt(token));
    if (!reset) throw new AppError("AUTH_RESET_LINK_INVALID");
    if (reset.isExpired()) throw new AppError("AUTH_RESET_LINK_EXPIRED");
    return reset;
  };

  // The account owner did not ask for the reset: the link is burnt.
  const cancelPasswordReset = async ({ token }) => {
    const reset = await findPendingReset(token);
    await passwordResetRepository.expireNow(reset._id);
    return null;
  };

  const resetPassword = async ({ token, password }) => {
    const reset = await findPendingReset(token);

    const user = await userRepository.findByIdWithPassword(reset.user_id);
    if (!user) throw new AppError("AUTH_RESET_LINK_INVALID");
    if ((await matchesPassword(user, password)).matched) throw new AppError("AUTH_PASSWORD_REUSED");

    await userRepository.setPassword(user._id, await hashPassword(password));
    await passwordResetRepository.markUsed(reset._id);
    // Whoever knew the old password may hold a session: every one is closed.
    await endAllSessions(user._id);
    notifyInBackground("password reset", resetPasswordNotification(user));
    return null;
  };

  return {
    register,
    profile,
    updateProfile,
    changePassword,
    openWidgetSession,
    confirmRegistration,
    signIn,
    requestPasswordReset,
    cancelPasswordReset,
    resetPassword,
  };
}
