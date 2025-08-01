import { body, param } from "express-validator";
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import validator from "validator";
const { isUUID } = validator;

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Le champ EMAIL ne peut être vide")
    .isEmail()
    .withMessage("EMAIL invalide")
    .escape()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value })
        .select("+password")
        .exec();
      console.log("user", user);
      if (user) {
        const isPassword = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (isPassword === true) {
          return true;
        } else {
          throw new Error("Identifiants incorrectes");
        }
      }
    }),
  body("password")
    .notEmpty()
    .withMessage("Le champ MOT DE PASSE ne peut être vide")
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
      minLowercase: 1,
    })
    .withMessage(
      "Le MOT DE PASSE n'est pas fort. Il doit contenir au moins : un caractère spécial, un chiffre, une lettre majuscule, une lettre miniscule"
    )
    .escape(),
];

export const validateRegister = [
  body("lastname")
    .notEmpty()
    .withMessage("Le nom est obligatoire")
    .isLength({ min: 1 })
    .withMessage("Renseignez au moins 2 caractères")
    .escape(),
  body("firstname")
    .notEmpty()
    .withMessage("Le prénom est obligatoire")
    .isLength({ min: 1 })
    .withMessage("Renseignez au moins 2 caractères")
    .escape(),
  body("email")
    .notEmpty()
    .withMessage("Le champ EMAIL est obligatoire")
    .isEmail()
    .withMessage("EMAIL invalide")
    .escape()
    .custom(async (value) => {
      const user = await User.find({ email: value }).exec();
      if (user.length > 0) {
        throw new Error("Ce email est déjà utilisé");
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("Le champ MOT DE PASSE ne peut être vide")
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
      minLowercase: 1,
    })
    .withMessage(
      "Le MOT DE PASSE n'est pas fort. Il doit contenir au moins : un caractère spécial, un chiffre, une lettre majuscule, une lettre miniscule"
    )
    .escape(),
  body("confirm_password")
    .notEmpty()
    .withMessage("Le champ MOT DE PASSE ne peut être vide")
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
      minLowercase: 1,
    })
    .withMessage(
      "Le MOT DE PASSE n'est pas fort. Il doit contenir au moins : un caractère spécial, un chiffre, une lettre majuscule, une lettre miniscule"
    )
    .escape()
    .custom(async (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("La confirmation de mot de passe à échouer");
      }
      return true;
    }),
];

export const validateConfirmRegister = [
  body("user_id").notEmpty().withMessage("Utilisateur non renseigné"),
  body("code").notEmpty().withMessage("Le code OTP est obligatoire"),
];

export const validateForgotPassword = [
  param("email")
    .notEmpty()
    .withMessage("EMAIL obligatoire")
    .isEmail()
    .withMessage("EMAIL invalide")
    .escape(),
];

export const validateDesaprove = [
  body("token")
    .notEmpty()
    .withMessage("Réinitialisation impossible obligatoire"),
];

export const validateResetPassword = [
  body("token").notEmpty().withMessage("Réinitialisation impossible"),
  body("password")
    .notEmpty()
    .withMessage("Le champ MOT DE PASSE ne peut être vide")
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
      minLowercase: 1,
    })
    .withMessage(
      "Le MOT DE PASSE n'est pas fort. Il doit contenir au moins : un caractère spécial, un chiffre, une lettre majuscule, une lettre miniscule"
    )
    .escape()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.params.email })
        .select("+password")
        .exec();
      if (!user) {
        throw new Error("Compte non trouvé");
      }
      const result = await bcrypt.compare(value, user.password);
      if (result === true) {
        throw new Error(
          "Vous ne pouvez pas utiliser votre ancien mot de passe"
        );
        return true;
      }
    }),
  body("confirm_password")
    .notEmpty()
    .withMessage("Le champ MOT DE PASSE ne peut être vide")
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
      minLowercase: 1,
    })
    .withMessage(
      "Le MOT DE PASSE n'est pas fort. Il doit contenir au moins : un caractère spécial, un chiffre, une lettre majuscule, une lettre miniscule"
    )
    .escape()
    .custom(async (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("La confirmation de mot de passe à échouer");
      }
      return true;
    }),
];
