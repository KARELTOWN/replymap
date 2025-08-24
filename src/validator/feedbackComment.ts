import * as yup from 'yup'

export default function feedbackCommentValidator() {
  const validateCreate = () => {
    return yup.object({
      content: yup
        .string()
        .required('Le nom du projet est obligatoire')
        .min(1, 'Minimum un caractère'),
      feedback_id: yup.string().required('Le feedback est obligatoire'),
    })
  }

  return {
    validateCreate,
  }
}
