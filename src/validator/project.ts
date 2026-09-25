import * as yup from 'yup'

export default function projectValidator() {
  const validateCreate = () => {
    return yup.object({
      libelle: yup
        .string()
        .required('Le nom du projet est obligatoire')
        .min(1, 'Minimum un caractère'),
      link: yup
        .string()
        .required('Le lien est obligatoire')
        .test('is-url', 'Lien invalide', (value) => {
          if (!value) return false
          try {
            // Try to build a URL object
            new URL(value)
            return true
          } catch {
            return false
          }
        }),
    })
  }

  const validateUpdate = () => {
    return yup.object({
      libelle: yup
        .string()
        .required('Le nom du projet est obligatoire')
        .min(1, 'Minimum un caractère'),
      link: yup
        .string()
        .required('Le lien est obligatoire')
        .test('is-url', 'Lien invalide', (value) => {
          if (!value) return false
          try {
            // Try to build a URL object
            new URL(value)
            return true
          } catch {
            return false
          }
        }),
      project_id: yup.string().required('Le projet est obligatoire'),
      track: yup.object().required('Les fonctionnalités sont obligatoires'),
      // Setting of the project itself: whether a visitor without a BugReveal
      // account may leave feedback on it.
      allow_guest_feedback: yup.boolean().default(false),
    })
  }

  return {
    validateCreate,
    validateUpdate
  }
}
