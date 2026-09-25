// How a feedback names the person who wrote it.
//
// Two kinds of author now reach the board: a member of the project, who has an
// account, and a guest, who only typed an email in the widget on a project
// open to visitors without an account. Both are shown the same way everywhere,
// with the guest marked as such — the team needs to know at a glance whether
// the person behind a report can be looked up in the project or not.

export type FeedbackAuthor = {
  name: string
  email: string
  guest: boolean
}

const fullName = (person: any) =>
  `${person?.firstname ?? ''} ${person?.lastname ?? ''}`.trim()

const UNKNOWN: FeedbackAuthor = { name: 'Auteur inconnu', email: '', guest: false }

export const feedbackAuthor = (feedback: any): FeedbackAuthor => {
  const member = feedback?.created_by
  if (member) {
    return { name: fullName(member) || member.email || UNKNOWN.name, email: member.email ?? '', guest: false }
  }

  const email = feedback?.guest_email || feedback?.email || ''
  if (!email && !feedback?.guest_name) return UNKNOWN

  return { name: feedback?.guest_name || email, email, guest: true }
}

// The same for an entry of the author filter, where a guest carries the
// "guest:<email>" identifier the API expects back.
export const authorOptionLabel = (person: any): string => {
  const name = fullName(person) || person?.email || ''
  return person?.guest ? `${name} (invité)` : name
}
