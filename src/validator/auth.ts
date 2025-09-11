import * as yup from 'yup'

export default function authValidator() {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

  const validateLogin = () => {
    return yup.object({
      email: yup.string().email('Email invalide').required('Email obligatoire'),
      password: yup
        .string()
        .required('Mot de passe obligatoire')
        .matches(
          passwordRegex,
          'Le mot de passe doit contenir au moins : 1 Majuscule, 1 miniscule, 1 chiffre, 1 caractère spéciale',
        ),
    })
  }

  const validateRegister = () => {
    return yup.object({
      firstname: yup
        .string()
        .min(1, 'Le prénom doit avoir au moins 1 caractère')
        .required('Email obligatoire'),
      lastname: yup
        .string()
        .min(1, 'Le prénom doit avoir au moins 1 caractère')
        .required('Email obligatoire'),
      email: yup.string().email('Email invalide').required('Email obligatoire'),
      password: yup
        .string()
        .required('Mot de passe obligatoire')
        .matches(
          passwordRegex,
          'Le mot de passe doit contenir au moins : 1 Majuscule, 1 miniscule, 1 chiffre, 1 caractère spéciale',
        ),
      confirm_password: yup
        .string()
        .required('Confirmation de Mot de passe obligatoire')
        .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas'),
    })
  }

  const validateOTP = () => {
    return yup.object({
      code: yup
        .array()
        .length(5, 'OTP non valide')
        .min(1, 'Le prénom doit avoir au moins 1 caractère')
        .required('OTP obligatoire'),
    })
  }

  return {
    validateLogin,
    validateRegister,
    validateOTP,
  }
}
