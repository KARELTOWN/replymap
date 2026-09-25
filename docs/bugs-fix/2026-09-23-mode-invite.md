# Mode invité — 23 septembre 2026

Destiné aux personnes qui reprennent ou déploient BugReveal (API, dashboard,
widget).

Livre le point 1 de [ameliorations-mvp.md](../produit/ameliorations-mvp.md).
La conservation et la purge des données (point 3) restent à faire : elles sont
repoussées après le MVP.

---

## Déposer un retour sans compte BugReveal

### Ce qui bloquait

Déposer un retour exigeait un compte BugReveal vérifié **et** une invitation
sur le projet. Un client qui faisait tester son produit à vingt personnes leur
demandait à chacune de créer un compte, de valider un email et d'attendre une
invitation.

### Ce qui change

Le mode invité s'active **projet par projet**, et il est **fermé par défaut** :
ouvrir sa collecte à des visiteurs sans compte est une décision du
propriétaire du projet, pas un réglage global.

- **Dans le dashboard**, sur la fiche du projet : « Accepter les retours sans
  compte BugReveal ».
- **Dans le widget**, quand l'option est active et que le visiteur n'est pas
  membre : le formulaire s'ouvre normalement et demande **un email**
  (obligatoire) et **un nom** (facultatif). L'email est retenu dans le
  navigateur du visiteur, pour qu'un deuxième retour n'oblige pas à le retaper.
- **Sur le tableau de suivi**, un retour d'invité porte le nom ou l'email saisi,
  avec la mention « invité ». Le filtre « Auteur » liste les invités à côté des
  membres.

### Ce qui reste fermé

| | Membre | Invité |
| - | ------ | ------ |
| Déposer un retour | oui | oui, si le projet est ouvert |
| Choisir la liste Trello à la soumission | oui | non |
| Lire les retours, les sessions, les rejeux | oui | non |

Un invité n'obtient **aucun accès en lecture** : il écrit, il ne consulte rien.

### Côté API

| Route | Authentification | Garde |
| ----- | ---------------- | ----- |
| `POST /api/feedback/guest/params` | aucune | projet suivi + mode invité ouvert, 60 appels / 15 min |
| `POST /api/feedback/guest` | aucune | idem, 10 envois / 15 min |

Ces deux routes sont déclarées **avant** l'authentification du module : il n'y
a pas de session à vérifier. Elles passent par la même garde d'ingestion que les
enregistrements (`requireTrackedProject` : projet existant, actif, domaine
d'origine attendu, quota), puis par `requireGuestFeedback`, qui refuse avec
`GUEST_FEEDBACK_CLOSED` (403) si le projet n'a pas ouvert sa collecte.

L'identité d'un retour ne vient jamais du corps de la requête : soit c'est le
compte authentifié, soit c'est l'email validé par le formulaire invité. Un
`created_by` envoyé dans le corps d'un envoi invité est ignoré.

### Modèle

| Champ | Où | Rôle |
| ----- | -- | ---- |
| `allow_guest_feedback` | `projects` | ouvre la collecte sans compte (faux par défaut) |
| `guest_email` | `feedbacks` | identité du visiteur, indexée |
| `guest_name` | `feedbacks` | facultatif |
| `created_by` | `feedbacks` | devient facultatif (nul pour un invité) |

Dans les filtres, un invité est désigné par `guest:<email>` puisqu'il n'y a pas
de compte à nommer.

## Vérifications

- `tests/guestFeedback.test.mjs` : un projet fermé refuse (`GUEST_FEEDBACK_CLOSED`),
  un projet ouvert laisse passer, et l'email enregistré est celui du formulaire
  et non celui du corps de la requête.
- `npm test` (73 tests) et `npm run lint:conventions` (0 violation).
