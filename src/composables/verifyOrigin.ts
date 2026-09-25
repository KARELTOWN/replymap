import { api } from './request'

export type RelayRefusal = 'invalid' | 'origin' | 'membership' | 'unavailable'

export interface RelayDecision {
  allowed: boolean
  reason?: RelayRefusal
}

/*
 * Decides whether the freshly obtained token may be relayed to the site that
 * opened this sign-in popup.
 *
 * Two conditions must both hold:
 *
 * 1. the target origin (`from`) is the registered domain of the project
 *    (`project_id`) for which the widget opened the window;
 * 2. the account that just signed in is a member of that project.
 *
 * The first condition alone can be bypassed: anyone can create a BugReveal
 * project pointing at their own domain, then open this page with that
 * project_id to collect a visitor's token. The second closes that door, since
 * the attacker would first have to invite the victim to their project, and it
 * costs nothing functionally: the widget only serves project members anyway.
 */
export async function isRelayAllowed(
  projectId: string | undefined,
  targetUrl: string | undefined,
  token: string | undefined,
): Promise<RelayDecision> {
  if (!projectId || !targetUrl || !token) {
    return { allowed: false, reason: 'invalid' }
  }

  let targetOrigin: string
  try {
    targetOrigin = new URL(targetUrl).origin
  } catch {
    return { allowed: false, reason: 'invalid' }
  }

  try {
    const projectResponse = await fetch(`${api}/project/show/${projectId}`)
    if (!projectResponse.ok) return { allowed: false, reason: 'unavailable' }

    const project = await projectResponse.json()
    const link: string | undefined = project?.data?.link
    if (!link) return { allowed: false, reason: 'origin' }

    let registeredOrigin: string
    try {
      registeredOrigin = new URL(link).origin
    } catch {
      return { allowed: false, reason: 'origin' }
    }

    if (targetOrigin !== registeredOrigin) {
      return { allowed: false, reason: 'origin' }
    }

    const membershipResponse = await fetch(`${api}/project/membership/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!membershipResponse.ok) {
      return {
        allowed: false,
        reason: membershipResponse.status === 401 ? 'invalid' : 'unavailable',
      }
    }

    const membership = await membershipResponse.json()
    if (membership?.data?.member !== true) {
      return { allowed: false, reason: 'membership' }
    }

    return { allowed: true }
  } catch {
    return { allowed: false, reason: 'unavailable' }
  }
}

export const relayRefusalMessage = (reason: RelayRefusal | undefined): string => {
  switch (reason) {
    case 'origin':
      return "Ce site n'est pas le domaine enregistré du projet : connexion refusée par sécurité."
    case 'membership':
      return "Votre compte n'est pas membre de ce projet. Demandez à l'équipe de vous y ajouter."
    case 'unavailable':
      return 'Vérification impossible pour le moment, réessayez dans un instant.'
    default:
      return 'Demande de connexion invalide.'
  }
}
