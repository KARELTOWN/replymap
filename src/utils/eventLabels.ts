// Human names for the tracked event types.
//
// The API stores a slug (`request_errors`), which the dashboard used to print
// as is: "Request_errors" in a table meant for an agency, not for a developer.
const LABELS: Record<string, string> = {
  runtime_errors: 'Erreur JavaScript',
  unhandle_promise_rejection: 'Promesse rejetée',
  request_errors: 'Requête en échec',
  performance_issues: 'Lenteur',
  page_view: 'Page vue',
  form_submit: 'Formulaire envoyé',
  form_error: 'Formulaire refusé',
}

export const eventLabel = (type?: string | null): string => {
  if (!type) return 'Événement'
  return LABELS[type] ?? type.replace(/_/g, ' ')
}

// Colours follow severity, so a list reads at a glance.
const TONES: Record<string, string> = {
  runtime_errors: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
  unhandle_promise_rejection: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
  request_errors: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  performance_issues: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400',
  page_view: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300',
  form_submit: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400',
  form_error: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
}

export const eventTone = (type?: string | null): string =>
  TONES[type ?? ''] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
