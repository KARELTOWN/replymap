# Déconnexion des autres appareils, et état d'installation — 24 septembre 2026

Destiné aux personnes qui reprennent ou déploient BugReveal (API, dashboard).

Fait suite à [2026-09-23-mode-invite.md](./2026-09-23-mode-invite.md).

---

## 1. « Vos autres appareils seront déconnectés » ne l'était pas

### Le problème

Après un changement de mot de passe, le message promettait la fermeture des
autres sessions. Dans un autre onglet — une fenêtre privée, un autre poste — on
restait pourtant connecté, et les requêtes continuaient de passer.

### Pourquoi

Changer le mot de passe révoquait bien tous les **jetons de rafraîchissement**
du compte. Mais le jeton qui autorise chaque requête est le **jeton d'accès** :
un JWT signé, autoporté, que le serveur n'a jamais stocké. Il restait donc
valable jusqu'à son expiration, soit **jusqu'à 15 minutes** de sursis pour
l'autre onglet.

La liste noire Redis ne pouvait pas aider : elle interdit **un** jeton précis,
celui présenté lors de la déconnexion. Pour les autres appareils, le serveur ne
connaît aucun jeton à interdire.

### Ce qui change

Le compte porte désormais une **date de coupure**, `sessions_valid_from`.

- Fermer toutes les sessions (déconnexion, changement de mot de passe,
  réinitialisation) écrit cette date sur le compte.
- À chaque requête authentifiée, un jeton d'accès émis **avant** cette date est
  refusé — l'authentification chargeait déjà le compte, cela ne coûte aucune
  lecture supplémentaire.
- La comparaison se fait en secondes pleines, comme le `iat` du JWT : l'onglet
  qui vient de changer le mot de passe reçoit un jeton émis après la coupure et
  reste connecté, ce que le message promet aussi.

La liste noire Redis reste en place pour la déconnexion ordinaire. Elle traite
le jeton présenté ; la coupure traite ceux que personne ne nous a présentés.

**Ce que cela ne fait pas** : déconnecter *un seul* appareil choisi dans une
liste. Il faudrait pour cela stocker chaque jeton d'accès émis, ou porter un
identifiant de session dans le jeton.

## 2. Rien ne confirmait que l'installation marchait

### Le problème

Après la création d'un projet, on copiait un script, on le collait sur son
site, et plus rien : aucun écran ne disait si les données arrivaient, ni
pourquoi elles n'arrivaient pas.

### Ce qui change

La fiche du projet affiche un **état d'installation** et un bouton **Tester**.

**L'état**, lu de ce que le projet a reçu :

| État | Quand | Ce qui est affiché |
| ---- | ----- | ------------------ |
| En attente des premières données | rien reçu | le rappel de coller le script avant `</body>` |
| Script détecté, données reçues | donnée reçue il y a moins de 24 h | date de la dernière donnée, nombre de sessions et d'évènements |
| Plus aucune donnée reçue | dernière donnée il y a plus de 24 h | idem |

**Le diagnostic**, quand quelque chose explique le silence :

- le projet est inactif ;
- toutes les collectes sont coupées — le script tourne et n'envoie rien, ce qui
  ressemble exactement à un script absent ;
- aucune adresse de site n'est enregistrée ;
- **des données ont été refusées**, avec la date et le domaine qui appelait.
  C'est le diagnostic le plus utile : le widget tourne sur le site d'un client,
  on ne peut pas l'interroger après coup. La garde d'ingestion garde donc en
  mémoire (Redis, 7 jours) le motif du dernier refus — mauvais domaine, projet
  inactif, plafond atteint.

**Le bouton Tester** charge la page du site depuis le serveur et y cherche les
deux balises du snippet. Trois réponses possibles :

- script trouvé et rattaché à ce projet ;
- script trouvé mais portant l'identifiant d'**un autre projet** (snippet copié
  d'un projet à l'autre : rien n'arrivera jamais ici) ;
- script absent du HTML — avec la réserve qui s'impose : un script injecté par
  un gestionnaire de balises n'y est pas, et les données reçues font foi.

**L'inventaire des sites.** Un projet déclare un domaine, mais le snippet se
copie à la main : il finit sur une préproduction, un second domaine, parfois un
site qui n'était pas prévu. La fiche liste donc **les sites qui envoient des
données**, avec la date de dernière activité, le domaine déclaré mis en
évidence, et les sites **refusés** — « le script tourne là-bas et se fait
renvoyer » est justement la réponse que l'on cherche.

Seul l'hôte est conservé, jamais une adresse complète. L'écriture est limitée à
une par hôte et par heure (verrou Redis) et n'est pas attendue par la requête
d'ingestion ; la liste est plafonnée à 20 entrées, pour qu'un snippet copié un
peu partout — ou une en-tête `Origin` forgée — ne fasse pas grossir le document
du projet sans fin.

**Désactiver un site.** Chaque site détecté porte un interrupteur. Le couper ne
refuse pas seulement les données : la fiche publique du projet répond
« inactif » à ce site précis, et **le script s'arrête entièrement là-bas** —
enregistrement, évènements *et* widget de feedback — sans toucher aux autres
sites. C'est ce qu'il faut quand on n'a pas la main sur le site où le snippet a
été posé.

Deux barrières plutôt qu'une : le script ne démarre plus, et la garde
d'ingestion refuse de toute façon ce qu'il enverrait encore
(`TRACKING_HOST_BLOCKED`). Seul le propriétaire du projet peut actionner
l'interrupteur, comme pour les autres réglages.

**Le délai.** Un onglet déjà ouvert avant la coupure continue jusqu'à son
prochain rechargement — le script ne relit la fiche du projet qu'au démarrage —
mais tout ce qu'il envoie entre-temps est refusé. Côté ingestion, le projet est
gardé en cache une minute : la coupure y est donc effective en moins d'une
minute, immédiatement pour un nouveau chargement de page.

### Côté API

| Route | Accès |
| ----- | ----- |
| `GET /api/project/installation/:project_id` | membre du projet |
| `POST /api/project/installation/test/:project_id` | membre du projet, 10 tests / 5 min |
| `PATCH /api/project/installation/host/:project_id` | propriétaire du projet |

### Le test charge une URL fournie par un utilisateur

C'est la partie à ne pas prendre à la légère : l'adresse testée vient du projet,
donc d'une saisie. Sans garde, le bouton transformerait le serveur en sonde de
son propre réseau (`http://localhost:6379`, `http://169.254.169.254/` et les
métadonnées du fournisseur cloud, les adresses privées).

`shared/net/pageFetch.js` encadre l'appel sortant :

- seuls `http:` et `https:` ;
- **toutes** les adresses derrière le nom doivent être publiques : boucle
  locale, plages privées, lien-local, CGNAT et leurs équivalents IPv6 sont
  refusés, IPv4 mappée en IPv6 comprise ;
- les redirections sont suivies à la main, trois au plus, chaque nouvel hôte
  étant revérifié ;
- 6 secondes de délai maximum, 512 Ko lus au plus.

## Vérifications

- `tests/authSession.test.mjs` : la coupure est écrite sur le compte, un jeton
  émis avant est refusé, celui émis après passe.
- `tests/installation.test.mjs` : les trois états, le refus d'ingestion qui
  explique le silence, l'inventaire des sites (refusés compris, sans doublon,
  plafonné), l'interrupteur par site (réservé au propriétaire, site inconnu
  refusé, script arrêté sur ce site et sur lui seul), le snippet reconnu, celui d'un autre projet, et le refus de charger
  une adresse du réseau interne.
- `npm test` (89 tests) et `npm run lint:conventions` (0 violation) ;
  `vue-tsc`, `vitest` et `vite build` côté dashboard.

## 3. Ce que chaque collecte ramasse vraiment

### Le problème

Trois écarts entre ce que la modale du projet promettait et ce que le script
faisait :

- **Les erreurs JavaScript étaient annoncées sous « Erreurs »**, alors qu'elles
  dépendaient en réalité de la case « Comportements ». Cocher « Erreurs » seul
  ne ramenait que les requêtes en échec.
- **Décocher « Enregistrement des sessions » coupait presque tout le reste.**
  Chaque traqueur appelait `rrweb.record.addCustomEvent` *avant* de mettre son
  évènement dans la file d'envoi. Or rrweb lève une exception quand il
  n'enregistre pas (« please add custom event after start recording ») : la
  ligne était coupée juste avant l'envoi, et erreurs, requêtes en échec et clics
  répétés étaient perdus sans un mot.
- **« Lenteurs » ne remontait jamais de tâche longue.** Une entrée `longtask`
  ne porte ni `responseEnd` ni `fetchStart` : la durée valait `NaN`, et
  `NaN >= 3` est faux. Seules les ressources lentes passaient — images et
  polices comprises, qui n'intéressent personne ici.

### Ce qui change

| Collecte | Ce qu'elle ramasse | Dépend d'une session ? |
| -------- | ------------------ | ---------------------- |
| Enregistrement des sessions | le rejeu, et avec lui les clics répétés, pages vues et formulaires refusés | — |
| Erreurs | erreurs JavaScript, promesses rejetées, requêtes en échec | **non** |
| Lenteurs | requêtes `fetch` et XHR au-delà de trois secondes | **non** |

- La marque posée sur la frise du rejeu passe par `addReplayEvent`, qui ne lève
  plus rien : placer l'évènement dans le rejeu est un bonus, son absence ne coûte
  plus l'évènement lui-même.
- `longtask` n'est plus observé, et les ressources sont filtrées sur
  `initiatorType` : seules les requêtes de l'application sont retenues.
- **La case « Comportements » a disparu.** Ce qu'elle couvrait n'a de sens que
  dans une session : elle suit désormais l'enregistrement, au lieu d'être un
  interrupteur qui ne faisait rien quand l'enregistrement était coupé. Le champ
  `track.active_event_issues` est retiré du modèle ; un projet qui l'avait à
  faux voit ces évènements revenir dès que l'enregistrement est actif.
- Les libellés de la modale disent maintenant ce que chaque case collecte, et
  laquelle fonctionne sans enregistrement.

## 4. Le parcours du visiteur, joué plutôt que listé

### Ce qui change

- **Les clics répétés ne sont plus collectés.** Le type `rage_click` disparaît du
  widget, de la liste des types, de la frise du rejeu et des libellés.
- **Les formulaires envoyés sont capturés** (`form_submit`) : le formulaire, la
  page et le bouton d'envoi sont identifiés. Rien de ce que le visiteur a tapé
  n'est lu.
- **Pages vues et formulaires envoyés quittent la liste des évènements.** Ils
  sont le chemin d'une session, pas des incidents : listés à côté des erreurs,
  ils enterraient sous des milliers de lignes la poignée d'erreurs qu'on venait
  chercher. Ils sont exclus même si le type est demandé par identifiant, et ne
  sont plus proposés comme filtre.
- **Ils se lisent sur la page d'une session, comme un flux animé.** Une page vue
  par ligne dans un tableau ne dit pas qu'Accueil est un carrefour ni que Pays
  est un cul-de-sac ; le graphe le montre.

### Le flux

`GET /api/session/flow/:session_id` (accès au projet de la session requis)
renvoie trois choses, construites par `sessionFlowService` :

| | |
| - | - |
| `nodes` | une page = un nœud, avec son nombre de visites et de formulaires envoyés |
| `edges` | un déplacement = une arête orientée ; un aller et un retour sont deux arêtes |
| `steps` | le chemin dans l'ordre : une étape `page` déplace le visiteur, une étape `form` non |

Les pages sont regroupées par chemin : la même page atteinte avec des
paramètres différents est un seul nœud, pas vingt.

Le dashboard pose les nœuds en serpentin dans l'ordre de première visite — deux
pages qui se suivent restent voisines — puis anime le visiteur d'une page à
l'autre : liaisons allumées derrière lui, compteur « ×N » sur les carrefours,
marqueur sur les pages d'où un formulaire est parti, et une phrase à chaque
étape. Le parcours se joue une fois à l'ouverture ; on peut le mettre en pause
ou sauter à une étape depuis le fil en bas.

### Vérifications

`tests/sessionFlow.test.mjs` : une page revue est un nœud visité deux fois,
aller et retour sont deux arêtes distinctes, un formulaire est une étape qui ne
déplace pas le visiteur, l'ordre est celui suivi, et une page à paramètres reste
un seul nœud. `npm test` : 94 tests.
