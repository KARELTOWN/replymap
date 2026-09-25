# Correctifs backend — 22 septembre 2026

Destiné aux personnes qui reprennent ou déploient l'API BugReveal.

Ce document fait suite à [2026-09-21-securite-et-collecte.md](./2026-09-21-securite-et-collecte.md).
Il couvre les défauts trouvés en déplaçant la logique des contrôleurs vers les
services, selon le cahier d'architecture (`docs/architecture/`). Chaque entrée
indique le défaut, la correction et ce qu'elle change pour les clients de l'API.

---

## 1. Comptes et mots de passe

**La réinitialisation modifiait le mot de passe d'un autre compte.**
Le contrôleur cherchait le compte avec `{ id: resetToken.user_id }`. Le champ
`id` n'existe pas dans le schéma : Mongoose ignorait le filtre et mettait à jour
le premier compte de la collection. La réponse renvoyait en plus ce compte
entier. La mise à jour vise désormais `user_id` du lien, et la réponse ne
contient plus aucune donnée de compte.

**Les liens de réinitialisation n'expiraient jamais.**
`expires_at` est `select: false` dans le schéma et n'était jamais demandé :
`isExpired()` comparait donc une date absente et répondait toujours « valide ».
Le dépôt demande maintenant le champ explicitement.

**La vérification « nouveau mot de passe différent de l'ancien » ne marchait pas.**
Elle lisait `req.params.email`, absent de la route `PATCH /reset-password`, et
comparait donc avec le premier compte de la base. Elle compare désormais avec
le compte du lien.

**La connexion révélait quels emails avaient un compte.**
« Le compte n'existe pas », « Compte non vérifié », « Identifiants invalides » :
trois réponses distinctes. Un email inconnu et un mauvais mot de passe
reçoivent maintenant le même code `AUTH_INVALID_CREDENTIALS`. L'état du compte
(`AUTH_ACCOUNT_UNAVAILABLE`) n'est dit qu'une fois le mot de passe vérifié. La
demande de réinitialisation répond le même message que l'email existe ou non
(elle plantait d'ailleurs sur un email inconnu, faute de `return`).

**La politique de robustesse bloquait la connexion.**
Elle était appliquée à la connexion : un mot de passe plus ancien que la règle
ne pouvait plus servir, et le message décrivait la règle à qui essayait des
mots de passe. Elle ne s'applique plus qu'à l'inscription et à la
réinitialisation.

**Les mots de passe étaient modifiés avant hachage.**
Les validateurs appliquaient `.escape()` au mot de passe : `a&b` était haché
comme `a&amp;b`. Le mot de passe n'est plus transformé. Les comptes existants
concernés se connectent toujours : le service essaie aussi la forme échappée,
puis remplace le hachage par celui du mot de passe réellement saisi.

**Le code de confirmation était prévisible et sans limite d'essais.**
Cinq chiffres tirés par `Math.random()`, et aucune limite sur
`/confirm-register`. Le code est tiré par `crypto.randomInt`, et la route est
limitée à 10 essais par quart d'heure et par adresse. L'inscription et les
routes de réinitialisation sont limitées elles aussi.

**Le type des codes de confirmation n'était jamais enregistré.**
Le champ `type` du schéma était déclaré sans `type: String` : Mongoose le lisait
comme un objet imbriqué. Corrigé dans le schéma.

**Un compte désactivé gardait l'accès pendant deux heures.**
L'authentification acceptait tout jeton d'accès valide. Elle refuse maintenant
un compte désactivé. Un refus répond avec l'enveloppe commune et le code
`AUTH_REQUIRED` (toujours en 401, le tableau de bord renouvelle son jeton comme
avant). Un jeton révoqué répond `AUTH_TOKEN_REVOKED`.

## 2. Projets

**N'importe quel compte pouvait modifier n'importe quel projet.**
`PUT /project/update/:project_id` ne vérifiait pas le propriétaire. La
modification est réservée au créateur (`PROJECT_OWNER_ONLY`).

**Un projet devenait non modifiable dès sa première session.**
Le validateur refusait toute modification une fois une session enregistrée. Seul
le lien est désormais figé (`PROJECT_LINK_LOCKED`) : il identifie le site suivi.
Le nom et les réglages de suivi restent modifiables. L'unicité du lien et du
nom est vérifiée parmi les projets du même propriétaire.

**Injection d'expression régulière dans le filtre des projets.**
Le terme de recherche partait tel quel dans `$regex`. Il est échappé, comme dans
le lecteur d'événements.

**La liste des projets n'était jamais paginée.**
La condition de pagination était inversée : avec `limit` et `page`, toute la
liste revenait. Elle est paginée.

**Création : doublon de lien.**
Le 403 « Le lien existe déjà » n'avait pas de `return` : le projet était créé
quand même. Code `PROJECT_LINK_EXISTS`.

## 3. Intégration Trello

**Le jeton Trello revenait dans les réponses.**
`storeToken` et `update` renvoyaient `{ ...document }` : l'étalement d'un
document Mongoose expose `_doc`, jeton compris, malgré le `delete result.token`.
La réponse ne contient plus que l'identifiant, l'outil, le projet, le tableau et
l'expiration.

**Un échec de Trello faisait planter la route des tableaux.**
Le service renvoyait `null` et le contrôleur lisait `result.boards`. L'échec
distant répond maintenant `INTEGRATION_REMOTE_FAILURE` (502). Une connexion
absente ou expirée répond `INTEGRATION_NOT_CONNECTED` ou `INTEGRATION_EXPIRED` ;
le tableau de bord lit ces codes pour proposer la reconnexion (il lisait
auparavant les messages `expired` et `not_found` des validateurs).

## 4. Architecture

- Les contrôleurs `project`, `auth` et `integration` ne contiennent plus de
  logique : ils valident, appellent un service et répondent par `ApiResponse`.
- Nouveaux services : `accountService` (inscription, confirmation, connexion,
  réinitialisation) et `integrationSetupService` (connexion de Trello depuis le
  tableau de bord).
- Nouveaux dépôts : `verificationCodeRepository`, `passwordResetRepository` ;
  compléments dans `userRepository`, `projectRepository`,
  `integrationRepository`, `sessionRepository`, `eventRepository`.
- Les middlewares (`isAuthentificate`, `projectAccess`, `blacklist`) passent par
  les dépôts et les services, et signalent leurs refus par `AppError`.
- Tous les validateurs portent des clés `validation.*` traduites en anglais et
  en français. Ils ne vérifient plus que la forme des entrées ; l'existence et
  les droits sont vérifiés par les services.
- Le vérificateur de conventions contrôle maintenant qu'aucune couche autre que
  les dépôts n'importe un modèle (hors seeders, tests et scripts).
- Code mort retiré : `helpers/generateUsername.js`, `helpers/OTPCode.js`,
  `helpers/generatePassword.js`, les fonctions pako inutilisées de
  `utils/util.js`, et l'import parasite de `morgan` dans `IntegrationToken`.
- Tous les commentaires des quatre dépôts sont en anglais. Les fichiers du
  widget de plus de 450 lignes ont été découpés (`canvasOps.js`,
  `formFields.js`, `formAttachments.js`, `formIntegrations.js`,
  `accessGate.js`, `editToolbar.js`).

## 5. Ce qui change pour les clients de l'API

- Les routes `auth`, `project` et `integration` répondent avec l'enveloppe
  commune (`success`, `message`, `data` / `error.code`, `error.details`).
  Le contenu de `data` garde sa forme historique.
- Les créations répondent 201 au lieu de 200 (projet, compte, jeton
  d'intégration, étiquette).
- Le tableau de bord et la fenêtre SSO ont été adaptés : la lecture des erreurs
  de connexion passe par le lecteur d'enveloppe commun.

---

## Vérification

```
back    npm test                    55 tests, 55 passés
back    npm run lint:conventions    0 violation
front   vue-tsc, vitest, build      OK (4 tests)
record  build, conventions          OK, 0 violation
sso     vue-tsc, build              OK
```

Tests de non-régression ajoutés : `tests/account.test.mjs` (réinitialisation
limitée au bon compte, lien expiré, réponse identique email inconnu / mauvais
mot de passe, anciens hachages échappés) et `tests/project.test.mjs`
(modification réservée au propriétaire, lien figé après collecte, champs non
modifiables ignorés, recherche littérale, règles de sortie d'un projet).

## Points encore ouverts

Voir [docs/architecture/migration-status.md](../architecture/migration-status.md),
notamment : jetons émis avant une réinitialisation toujours valides jusqu'à
expiration, emails enregistrés échappés, et traduction des écrans du tableau
de bord et du widget.
