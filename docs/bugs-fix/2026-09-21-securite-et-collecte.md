# Correctifs backend — 21 septembre 2026

Destiné aux personnes qui reprennent ou déploient l'API BugReveal.

Ce document couvre les corrections apportées au dépôt `back`. Chaque entrée
indique le défaut constaté, la correction et ce qu'elle implique au
déploiement. Les points qui restent ouverts figurent en fin de document.

---

## 1. Secrets versionnés

**Constat.** La clé et le secret d'API Trello, les clés d'accès au stockage
objet, les clés de signature des jetons et la clé Elastic étaient écrits en
clair dans `utils/keys.js`, fichier suivi par Git. Les fichiers
`.env.docker` et `.env.preprod` étaient eux aussi suivis. Toute personne ayant
eu accès au dépôt, ou simplement à son historique, pouvait signer des jetons
valides et lire le bucket de stockage.

**Correction.**

- `utils/keys.js` ne contient plus aucune valeur : il lit l'environnement et
  lève une erreur explicite en cas de variable manquante. Ses exports
  `cryptKeys`, `awsS3Keys`, `encryptKeys` et `elasticSearchKeys` ont disparu,
  ils dupliquaient des variables déjà lues ailleurs et personne ne les
  importait.
- Un coffre chiffré par espace a été mis en place (`scripts/secrets.js`). Le
  fichier d'environnement en clair ne quitte plus la machine ; seule sa version
  chiffrée est versionnée, dans `secrets/<espace>.enc`.
- `.env`, `.env.*`, `.secrets.keys.json` et `storage/` sont désormais ignorés
  par Git. Les fichiers déjà suivis ont été retirés de l'index.
- `.env.example` documente les variables attendues, sans aucune valeur.

**Fonctionnement du coffre.** Chaque espace possède sa propre clé maîtresse :
une personne disposant de la clé de développement ne peut rien lire de la
production. Le chiffrement est un AES-256-GCM, donc authentifié : un fichier
altéré est refusé au déchiffrement.

| Espace    | Fichier d'environnement | `NODE_ENV`    |
| --------- | ----------------------- | ------------- |
| `local`   | `.env`                  | (aucun)       |
| `dev`     | `.env.docker`           | `development` |
| `staging` | `.env.preprod`          | `preprod`     |
| `prod`    | `.env.production`       | `production`  |

```bash
npm run secrets -- init <espace>            # crée la clé maîtresse
npm run secrets -- encrypt <espace>         # chiffre le fichier d'environnement
npm run secrets -- decrypt <espace>         # le restaure sur la machine
npm run secrets -- list <espace>            # liste les clés, valeurs masquées
npm run secrets -- set <espace> CLE=valeur  # modifie une valeur dans le coffre
npm run secrets -- check <espace>           # vérifie les clés obligatoires
npm run secrets -- rotate <espace>          # remplace la clé maîtresse
npm run secrets -- audit                    # cherche des secrets suivis par Git
```

La clé maîtresse se déclare sur le serveur par
`BUGREVEAL_SECRETS_KEY_<ESPACE>`, ou reste dans `.secrets.keys.json` sur un
poste de développement. Ce fichier n'est pas versionné.

> **Note de vocabulaire.** Le besoin exprimé parlait de « hash » des clés. Un
> hachage est à sens unique : il ne permettrait pas de récupérer la valeur au
> démarrage de l'application. C'est donc un chiffrement réversible qui est mis
> en place, avec une clé par espace.

**Ce qui reste à faire, et qui n'appartient pas au code.** Les secrets restent
présents dans l'historique Git. Deux actions sont nécessaires, dans cet ordre :

1. **faire tourner toutes les clés exposées** : Trello, stockage objet,
   signature des jetons, Elastic. Tant que ce n'est pas fait, le nettoyage de
   l'historique ne protège rien ;
2. purger l'historique (`git filter-repo`), en coordination avec toutes les
   copies du dépôt, puisque l'opération réécrit les identifiants de commit.

---

## 2. Points d'entrée de collecte ouverts

**Constat.** La création de session, sa clôture, le dépôt des morceaux
d'enregistrement et l'envoi d'événements ne demandaient aucune authentification
et n'appliquaient aucune limite. N'importe qui pouvait fabriquer des sessions
et pousser des données pour n'importe quel projet, directement sur le stockage.

Ces routes ne peuvent pas exiger de compte : le widget tourne chez le client
final, le plus souvent devant un visiteur anonyme.

**Correction.** Un middleware `requireTrackedProject`
(`middleware/trackedProject.js`) est posé devant `session/create`,
`session/end`, `chunk/store` et `event/store`. Il applique trois contrôles :

1. le projet existe et son suivi est actif ;
2. l'origine de l'appel correspond au domaine déclaré du projet, avec repli sur
   le référent lorsque l'origine est absente ;
3. le volume est plafonné par projet et par appelant, via Redis.

Les projets sont mis en cache soixante secondes : un dépôt de morceaux survient
toutes les quelques secondes par visiteur, sans cache chacun ajouterait une
lecture en base.

**Réglages.** `INGEST_RATE_MAX` (600 par défaut) et `INGEST_RATE_WINDOW`
(60 secondes). Une panne de Redis laisse passer la collecte plutôt que de
perdre les données des clients.

**Limite connue.** L'en-tête d'origine est posé par le navigateur et ne peut
pas être modifié depuis une page web, mais reste falsifiable par un client hors
navigateur. La limitation de débit constitue la seconde ligne. La réponse
complète serait un jeton d'écriture propre à chaque projet, remis au widget
dans son script de suivi.

---

## 3. Lecture publique d'une session

**Constat.** `GET /api/session/show/:session_id` est appelée par le widget pour
savoir si une session est toujours ouverte. Elle renvoyait aussi l'identifiant
du visiteur, ses métadonnées de localisation et le nom du projet : toute
personne connaissant un identifiant de session pouvait les lire.

**Correction.** La réponse est réduite à `startedAt` et `endedAt`, les seuls
champs dont le widget a besoin. Le tableau de bord, lui, passe par
`session/show_with_chunks`, qui est authentifiée.

---

## 4. En-têtes de sécurité et politique d'origines

**Constat.** Helmet était absent. Surtout, toute origine inconnue recevait
`Access-Control-Allow-Origin: *` sur l'ensemble de l'API, routes du tableau de
bord comprises.

**Correction.**

- Helmet est installé et activé. La politique de contenu est laissée de côté :
  cette application ne sert que du JSON et des fichiers, et une politique mal
  réglée casserait le widget sans rien protéger de plus. La ressource reste
  lisible depuis une autre origine, puisque les captures sont servies aux sites
  clients.
- Le caractère générique est réservé aux routes que le widget doit réellement
  pouvoir appeler depuis un domaine quelconque : collecte, feedback, lecture
  publique d'un projet, appartenance et intégrations. Partout ailleurs, seules
  les origines déclarées dans `APP_ORIGINS` sont acceptées, et ce sont les
  seules autorisées à porter des identifiants.

**Nouvelle variable.** `APP_ORIGINS`, liste d'origines séparées par des
virgules. Elle remplace la liste qui était écrite en dur dans `index.js`.

---

## 5. Tâche d'entretien des sessions

**Constat.** La tâche planifiée s'exécutait chaque minute et relisait la
collection entière : `Chunk.distinct("session_id")` chargeait en mémoire tous
les identifiants de session existants, puis les passait en `$nin` à une
suppression. Passé quelques dizaines de milliers de sessions, la requête
dépassait la limite de 16 Mo de MongoDB et la tâche échouait en silence.
L'agrégation, de son côté, regroupait tous les morceaux jamais enregistrés puis
réécrivait chaque session, y compris celles closes depuis des mois.

**Correction.** `services/schedule.js` est réécrit en deux passes bornées à 500
éléments :

- `closeIdleSessions` n'examine que les sessions encore ouvertes et les
  referme sur la date de leur dernier morceau après trois minutes d'inactivité ;
- `removeEmptySessions` ne considère que les sessions restées ouvertes et
  antérieures à trente minutes, puis vérifie l'absence de morceau session par
  session.

**Règle intangible, respectée par construction.** Une session qui possède au
moins un morceau d'enregistrement n'est jamais supprimée. La vérification se
fait par un test d'existence indexé pour chaque candidate, et non par une
exclusion globale.

Deux index accompagnent ces requêtes : `{ session_id, createdAt }` sur les
morceaux, `{ endedAt, startedAt }` sur les sessions.

---

## 6. Module WebSocket supprimé

`services/socket/socketService.js` n'était utilisé nulle part. Le module et les
dépendances `socket.io` et `socket.io-client` ont été retirés du projet.

---

## 7. Périmètre du module feedback

Le produit recueille et suit les retours, il ne remplace pas un gestionnaire de
tâches. Ont été retirés :

- **les commentaires** : modèle `FeedbackComment`, contrôleur, validateur et
  les deux routes associées ;
- **l'assignation** : champs `assign_to_id` et `assign_to_name`, route
  `integration/get_board_members`, récupération des membres d'un tableau et
  affectation d'un membre à une carte ;
- **la priorité**, déjà absente du modèle.

Le seul champ de suivi géré côté BugReveal est le **statut**, parce qu'il porte
le tableau kanban et la synchronisation avec l'outil externe.

En contrepartie, deux manques ont été comblés :

- `PUT /api/feedback/update/:feedback_id` accepte désormais le **titre** en
  plus du type, du statut et de la description ;
- `DELETE /api/feedback/delete/:feedback_id` supprime un retour, ses fichiers
  et son historique. La carte créée dans l'outil externe n'est pas touchée :
  elle appartient au tableau de son propriétaire.

---

## 8. Synchronisation Trello

**Constat.** La synchronisation n'existait que dans un sens. Le webhook
répercutait un déplacement de carte sur le statut du feedback, mais changer le
statut depuis le tableau de bord ne déplaçait rien : le suivi divergeait dès
qu'on travaillait depuis BugReveal.

**Correction.**

- `moveCardToStatusList` déplace la carte quand le statut change, en suivant la
  correspondance listes/statuts configurée sur le projet. Un statut sans
  correspondance ne déclenche aucun appel : ce n'est pas une erreur, toutes les
  colonnes n'ont pas d'équivalent dans l'outil.
- Le webhook ignore l'écho d'un déplacement initié par BugReveal, qui créait
  sinon une seconde entrée d'historique attribuée à Trello, et trace l'origine
  du changement dans `FeedbackHistory.source`.
- Le feedback mémorise `integration_card_url`, pour que le suivi renvoie
  directement vers la carte.

Trello est la seule intégration prise en charge. Jira et ClickUp figuraient
dans le jeu de données initial sans aucune implémentation derrière.

---

## 9. Contrôle d'accès du module feedback

**Constat.** L'authentification ne prouvait que l'existence d'un compte. Aucune
route ne vérifiait l'appartenance au projet, alors que l'identifiant de projet
est public : il figure en clair dans le script de suivi posé sur le site du
client.

**Correction.** `middleware/projectAccess.js` expose deux niveaux :

- `requireProjectContributor` et `requireFeedbackContributor`, appartenance
  stricte, pour déposer un retour ;
- `requireProjectMember` et `requireFeedbackAccess`, pour consulter et gérer,
  avec dérogation pour le rôle plateforme « Administrateur », qui voit déjà
  l'ensemble des projets ailleurs dans l'application.

Ces middlewares chargent au passage le projet ou le feedback sur la requête,
ce qui évite au contrôleur de les relire.

---

## 10. Cycle de vie des sessions de connexion

- **La déconnexion ne déconnectait pas.** Seul le jeton d'accès était mis en
  liste noire ; le jeton de rafraîchissement restait valable trente jours. La
  route est passée en `POST /api/auth/deconnect` et révoque les deux.
- **Le renouvellement acceptait n'importe quel jeton signé.** Il ne vérifiait
  ni la révocation, ni l'existence du compte, ni sa désactivation.
- **Les routes d'authentification étaient sans limite.** Un plafond adossé à
  Redis a été ajouté : dix connexions par cinq minutes, soixante
  renouvellements par cinq minutes, cinq demandes de mot de passe par quart
  d'heure.

---

## 11. Corrections de fond diverses

- `utils/util.js:isAdmin` cherchait un rôle dont l'identifiant était celui de
  l'utilisateur : la fonction renvoyait toujours faux.
- `middleware/blacklist.js` laissait la requête se poursuivre après avoir
  répondu 403 : le contrôleur s'exécutait avec un jeton révoqué.
- L'invitation insérait le membre malgré le refus, ce qui levait une erreur
  d'index unique. Elle est désormais réservée au créateur du projet.
- Retirer un membre n'était réservé à personne.
- L'envoi vers une intégration échouait sur un feedback sans capture.
- Le tableau de suivi lançait une requête par statut ; il n'en lance plus
  qu'une, avec un index composite.
- Les fichiers temporaires écrits par multer restaient sur le disque quand la
  requête était refusée.

---

## Vérification

```
npm test        27 tests, 27 passés
```

La suite s'exécute sans MongoDB ni Redis : `tests/support/` substitue les
modules d'infrastructure par des doublures. Elle couvre les gardes d'accès, la
garde de collecte, le cycle de vie des jetons et la synchronisation Trello.

---

## Points encore ouverts

- **Rotation du jeton de rafraîchissement.** Non implémentée : sans mécanisme
  de grâce, elle déconnecterait les onglets concurrents d'un même compte.
- **Vérification de propriété de domaine à la création d'un projet.** C'est la
  correction de fond du relais de session par fenêtre surgissante, et une
  décision produit : elle suppose un enregistrement DNS ou un fichier déposé
  sur le domaine.
- **Jeton d'écriture par projet** pour la collecte, qui remplacerait le
  contrôle d'origine décrit au point 2.
- **Purge de l'historique Git**, après rotation des clés.
