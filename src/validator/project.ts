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
        // .url("Il doit s'agir d'un lien") // utilisé en production
        .test('is-url', 'Lien invalide', (value) => {
          if (!value) return false
          try {
            // Essaie de construire un objet URL
            new URL(value)
            return true
          } catch {
            return false
          }
        }),
    })
  }

  return {
    validateCreate,
  }
}
