import express from "express";
const AuthRouter = express.Router();
import jwt from "jsonwebtoken";

import {
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateConfirmRegister,
  validateDesaprove,
} from "../../validator/auth/authValidator.js";
import authController from "../../controllers/auth/authController.js";
import isauthentificate from "../../middleware/isAuthentificate.js";
import { blacklist } from "../../middleware/blacklist.js";

const {
  login,
  register,
  forgotPassword,
  refreshToken,
  desapprove,
  resetPassword,
  confirmRegister,
  deconnect
} = authController();
AuthRouter.post("/login", validateLogin, login);


AuthRouter.post("/register", validateRegister, register);

AuthRouter.post("/confirm-register", validateConfirmRegister, confirmRegister);

AuthRouter.post("/refresh-token", refreshToken);
AuthRouter.get(
  "/forgot-password/:email",
  validateForgotPassword,
  forgotPassword
);
AuthRouter.post("/desapprouve-reinitialisation", validateDesaprove, desapprove);
AuthRouter.patch("/reset-password", validateResetPassword, resetPassword);
AuthRouter.get('/deconnect', isauthentificate, blacklist, deconnect)
export default AuthRouter;
