# Ce qui manque au MVP

Destiné à l'équipe produit et aux personnes qui développeront BugReveal.

Ce document liste les écarts entre l'outil tel qu'il est aujourd'hui et ce
qu'attend une entreprise qui veut récolter les retours de ses premiers
utilisateurs. Il ne décrit pas le fonctionnement actuel : pour cela, voir
[docs/architecture/](../architecture/README.md). Les défauts corrigés sont dans
[docs/bugs-fix/](../bugs-fix/), la dette technique restante dans
[migration-status.md](../architecture/migration-status.md).

Chaque point indique ce qui manque, pourquoi cela compte pour cette cible, et
la décision produit à prendre avant de coder. L'effort est donné en ordre de
grandeur, pas en engagement.

## Ce qui est déjà en place

Pour situer : capture d'écran annotée, enregistrement vidéo, recadrage,
enregistrement et rejeu des sessions avec chronologie synchronisée, suivi des
erreurs JavaScript, des requêtes en échec, des clics répétés, des pages vues,
des formulaires refusés et des lenteurs, tableau de suivi des retours
synchronisé dans les deux sens avec Trello, invitations par projet, mode invité
par projet (retour sans compte, identifié par email), état d'installation du
script avec diagnostic et test à la demande, notifications email, sessions
sécurisées et cloisonnées par projet.

## Priorités

| # | Manque | Pourquoi maintenant | Effort |
| - | ------ | ------------------- | ------ |
| 1 | Conservation et purge des données | Bloque les ventes en Europe, borne les coûts | Moyen |
| 2 | Webhook sortant | Ouvre toutes les intégrations d'un coup | Court |
| 3 | Retour à l'auteur quand son signalement avance | Donne envie d'en signaler un deuxième | Court |
| 4 | Recherche dans les retours | Indispensable passé cinquante retours | Court |
| 5 | Rôles et permissions | Un rejeu montre l'écran d'un utilisateur | Moyen |
| 6 | Quotas et limites | Pas de modèle économique sans compteur | Moyen |
| 7 | Traduction et personnalisation du widget | Vendre hors de France, vendre à une marque | Moyen |

---

## 1. Conservation et purge des données

**Constat.** Rien n'efface les données avec le temps. Les enregistrements
s'accumulent sans limite, et il n'existe ni export ni suppression sur demande.

**Pourquoi cela bloque.** Un enregistrement de session montre l'écran d'une
personne. Une entreprise européenne demandera une durée de conservation, une
purge automatique et de quoi répondre à une demande de suppression. C'est aussi
votre facture de stockage qui grandit indéfiniment.

**Ce qu'il faut.** Une durée par projet (par exemple 30, 90 ou 180 jours), une
purge automatique par le cron existant, et deux actions : exporter ce qui
concerne une personne, supprimer ce qui la concerne.

**Décision à prendre.** La durée par défaut, et si elle est modifiable par le
client ou fixée par le plan.

**Repoussé volontairement** après le MVP : tant que les premiers clients
testent, rien n'est assez vieux pour être purgé.

## 2. Webhook sortant

**Constat.** Trello est la seule intégration.

**Ce qu'il faut.** Un webhook par projet, appelé à la création d'un retour et à
son changement de statut, avec une signature pour que le destinataire vérifie
l'origine. Un seul développement ouvre Slack, Teams, Jira, Linear, n8n et
n'importe quel outil interne.

**Effort court** : la synchronisation Trello a déjà posé les briques (service
d'intégration, signature de webhook entrant, historique).

## 3. Retour à l'auteur quand son signalement avance

**Constat.** L'auteur d'un retour est explicitement exclu des notifications :
c'est juste au moment où il écrit, mais il ne saura jamais que son bug a été
corrigé.

**Ce qu'il faut.** Une notification à l'auteur au changement de statut, et de
quoi lui répondre en une phrase depuis la fiche du retour.

**Effort court** : le catalogue de notifications et l'historique existent
(voir [notifications.md](../architecture/notifications.md)).

## 4. Recherche dans les retours

**Constat.** On filtre par projet, auteur, type, statut et période. On ne peut
pas chercher un mot dans les titres et les descriptions.

**Ce qu'il faut.** Une recherche plein texte sur le titre et la description,
limitée au projet consulté.

**Attention.** Le terme de recherche doit être échappé avant d'atteindre la
base : une expression régulière construite depuis une saisie est un moyen
simple de bloquer le serveur. Les listes existantes le font déjà.

## 5. Rôles et permissions

**Constat.** Tous les membres d'un projet voient tout et peuvent tout faire,
sauf les actions réservées au créateur (inviter, modifier, retirer).

**Ce qu'il faut.** Au minimum trois rôles : propriétaire, membre, client. Le
client voit les retours sans accéder aux rejeux, qui sont la donnée la plus
sensible.

Le catalogue de permissions, la matrice des rôles et le chemin de migration
sont écrits dans [roles-et-permissions.md](./roles-et-permissions.md).

**Décision à prendre.** Si l'Administrateur de plateforme garde le droit de
rejouer les sessions de tous les projets.

## 6. Quotas et limites

**Constat.** La garde de collecte sait refuser au-delà d'un plafond, mais rien
ne définit de plan, de quota de stockage ni de nombre de projets.

**Ce qu'il faut.** Un compteur par projet et par mois (sessions enregistrées,
retours, stockage), un plafond par plan, et un message clair quand il est
atteint — côté widget comme côté tableau de bord.

## 7. Traduction et personnalisation du widget

**Constat.** Tous les textes du widget sont écrits en français dans le code, et
son apparence n'est pas paramétrable.

**Ce qu'il faut.** Un catalogue de traductions comme celui de l'API, la langue
choisie par projet ou héritée du navigateur du visiteur, et au minimum une
couleur d'accent et une position du bouton flottant par projet.

---

## Suite conseillée

1. Point 3, court, qui améliore immédiatement l'expérience des premiers clients.
2. Point 2, meilleur rapport effort/portée pour les intégrations.
3. Point 1, dès que le MVP sort de sa phase de test : il conditionne les ventes
   aux entreprises et borne les coûts de stockage.

Ce document se met à jour : quand un point est livré, il quitte cette liste et
son correctif est décrit dans `docs/bugs-fix/`.
