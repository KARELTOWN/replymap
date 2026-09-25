import { body, cookie, header, param } from "express-validator";
import { refreshCookieName, csrfCookieName } from "../../shared/http/authCookies.js";

// Shape of the authentication inputs. Whether an email is taken, a password
// matches or a code is right are rules of accountService.
//
// Passwords are never transformed: they used to go through `.escape()`, which
// hashed `a&amp;b` for a typed `a&b`. accountService still accepts those
// legacy hashes.

const PASSWORD_POLICY = {
  minLength: 8,
  minNumbers: 1,
  minSymbols: 1,
  minUppercase: 1,
  minLowercase: 1,
};

const email = (location = body) =>
  location("email")
    .trim()
    .notEmpty()
    .withMessage("validation.emailRequired")
    .bail()
    .isEmail()
    .withMessage("validation.invalidEmail");

const newPassword = () =>
  body("password")
    .notEmpty()
    .withMessage("validation.passwordRequired")
    .bail()
    .isStrongPassword(PASSWORD_POLICY)
    .withMessage("validation.weakPassword");

const confirmation = () =>
  body("confirm_password")
    .notEmpty()
    .withMessage("validation.passwordRequired")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("validation.passwordMismatch");
      return true;
    });

// The refresh token and its CSRF pair come from cookies and a header. Their
// absence is not a validation error but an ended session: authSessionService
// answers 401, which clients treat as "sign in again".
const hexSecret = (field) =>
  field.optional().isHexadecimal().withMessage("validation.invalidTokenFormat");

export const validateRefreshToken = [
  hexSecret(cookie(refreshCookieName())),
  hexSecret(cookie(csrfCookieName())),
  hexSecret(header("x-refresh-csrf")),
];

export const validateUpdateProfile = [
  body("firstname").trim().notEmpty().withMessage("validation.firstnameRequired"),
  body("lastname").trim().notEmpty().withMessage("validation.lastnameRequired"),
];

// The current password is asked for so a forgotten open tab cannot be used to
// take the account over.
export const validateChangePassword = [
  body("current_password").notEmpty().withMessage("validation.passwordRequired"),
  newPassword(),
  confirmation(),
];

export const validateWidgetToken = [
  body("project_id")
    .notEmpty()
    .withMessage("validation.projectRequired")
    .bail()
    .isMongoId()
    .withMessage("validation.invalidProjectId"),
];

// Signing out needs the access token being ended.
export const validateLogout = [
  header("authorization")
    .matches(/^Bearer \S+$/)
    .withMessage("validation.invalidTokenFormat"),
];

// The strength policy applies to new passwords only: checking it at sign-in
// described the policy to anyone guessing, and locked out older passwords.
export const validateLogin = [
  email(),
  body("password")
    .notEmpty()
    .withMessage("validation.passwordRequired")
    .bail()
    .isString()
    .withMessage("validation.stringExpected"),
];

export const validateRegister = [
  body("lastname").trim().notEmpty().withMessage("validation.lastnameRequired"),
  body("firstname").trim().notEmpty().withMessage("validation.firstnameRequired"),
  email(),
  newPassword(),
  confirmation(),
];

export const validateConfirmRegister = [
  body("user_id")
    .notEmpty()
    .withMessage("validation.accountRequired")
    .bail()
    .isHexadecimal()
    .withMessage("validation.accountRequired"),
  body("code")
    .notEmpty()
    .withMessage("validation.codeRequired")
    .bail()
    .matches(/^\d{5}$/)
    .withMessage("validation.invalidCode"),
];

export const validateForgotPassword = [email(param)];

export const validateDesaprove = [
  body("token")
    .notEmpty()
    .withMessage("validation.resetTokenRequired")
    .bail()
    .isHexadecimal()
    .withMessage("validation.resetTokenRequired"),
];

export const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("validation.resetTokenRequired")
    .bail()
    .isHexadecimal()
    .withMessage("validation.resetTokenRequired"),
  newPassword(),
  confirmation(),
];
