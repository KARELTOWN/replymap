# Rôles et permissions par projet

Destiné aux personnes qui implémenteront les rôles, et à l'équipe produit pour
arbitrer avant de coder.

Ce document décrit un fonctionnement **à construire** : il n'est pas implémenté.
L'état actuel est décrit plus bas, et le point correspondant du cahier produit
est le [point 5](./ameliorations-mvp.md).

---

## Où passe la vraie frontière

Sur GitHub, l'axe est *lire / trier / écrire / administrer*. Ici il est
différent : **un rejeu montre l'écran d'une personne**. C'est cette permission
qui mérite d'être isolée, pas celle de modifier un titre. Un client doit pouvoir
suivre ses retours sans jamais rejouer la session de quelqu'un.

Le second axe est l'administration du projet : réglages, équipe, intégrations.
Tout le reste — déposer, lire, traiter un retour — est le travail courant et se
partage largement.

## Catalogue de permissions

Chaque permission correspond à des routes qui existent aujourd'hui.

| Permission | Ce qu'elle ouvre |
| ---------- | ---------------- |
| `feedback.create` | déposer un retour depuis le widget |
| `feedback.read` | tableau de suivi, fiche d'un retour, historique |
| `feedback.update` | changer statut / type / titre / description |
| `feedback.delete` | supprimer un retour |
| `feedback.push` | envoyer manuellement une carte vers l'outil externe |
| `replay.read` | **rejouer une session** — l'écran du visiteur |
| `analytics.read` | sessions, évènements, visiteurs, statistiques, sans rejeu |
| `project.read` | fiche, script d'installation, état d'installation, sites détectés |
| `project.test` | lancer le test d'installation (le serveur charge la page) |
| `project.update` | nom, domaine, collectes, mode invité |
| `team.read` / `team.manage` | voir les membres / inviter, retirer, changer un rôle |
| `integration.manage` | connecter Trello, choisir le tableau, mapper statuts et libellés |
| `project.delete` | supprimer le projet ou le transférer |

## Les rôles

| | Propriétaire | Administrateur | Membre | Client |
| - | :-: | :-: | :-: | :-: |
| `feedback.create` | ✓ | ✓ | ✓ | ✓ |
| `feedback.read` | ✓ | ✓ | ✓ | ✓ |
| `feedback.update` | ✓ | ✓ | ✓ | — |
| `feedback.push` | ✓ | ✓ | ✓ | — |
| `feedback.delete` | ✓ | ✓ | — | — |
| **`replay.read`** | ✓ | ✓ | ✓ | — |
| `analytics.read` | ✓ | ✓ | ✓ | ✓ |
| `project.read` | ✓ | ✓ | ✓ | ✓ |
| `project.test` | ✓ | ✓ | ✓ | — |
| `project.update` | ✓ | ✓ | — | — |
| `team.read` | ✓ | ✓ | ✓ | — |
| `team.manage` | ✓ | ✓ | — | — |
| `integration.manage` | ✓ | ✓ | — | — |
| `project.delete` | ✓ | — | — | — |

**Développeur, testeur, contributeur, maintainer** ont été envisagés comme rôles
distincts. Ils se rejoignent ici :

- *maintainer* et *administrateur* désignent la même chose — les réglages,
  l'équipe, les intégrations ;
- *développeur*, *testeur* et *contributeur* ont exactement les mêmes droits.
  La seule différence envisagée était la copie du script d'installation, et
  elle a été abandonnée : le snippet ne contient que l'URL du script et
  l'identifiant du projet, tous deux lisibles dans le HTML du site suivi. En
  faire une permission aurait donné une barrière d'organisation déguisée en
  barrière de sécurité.

Rien n'interdit d'afficher « Testeur » comme libellé d'un membre, mais ce serait
une étiquette, pas un droit : deux rôles aux permissions identiques se paient en
confusion à chaque question « pourquoi lui et pas moi ? ».

**Version minimale** si l'on veut livrer plus tôt : Propriétaire, Membre,
Client. L'administrateur s'ajoute ensuite sans rien casser, puisque c'est le
même catalogue.

## Les invités

Le mode invité (retour déposé sans compte) reste hors de ce tableau : pas de
compte, pas de rôle, écriture seule. Voir
[le correctif du 23 septembre](../bugs-fix/2026-09-23-mode-invite.md).

## L'état actuel, et ce qu'il faut changer

Aujourd'hui l'accès est binaire — membre ou non
(`middleware/projectAccess.js`) — avec quelques actions réservées au créateur
(`PROJECT_OWNER_ONLY`). Tout membre voit donc tous les rejeux.

À faire :

1. `UserProject` porte un champ `role` : la table ne contient aujourd'hui que
   `user_id` et `project_id`.
2. Un `can(user, projectId, permission)` dans `accessService`, et des gardes
   `requirePermission("replay.read")` en lieu et place de `requireProjectMember`
   et `requireProjectContributor`.
3. Migration : le créateur devient Propriétaire, les membres actuels deviennent
   Membre — personne ne perd d'accès.
4. Côté dashboard : choix du rôle dans la modale d'invitation, rôle affiché et
   modifiable dans la liste des membres.

**À trancher.** Le rôle **Administrateur de plateforme**
(`services/access/accessService.js`) contourne actuellement tous ces contrôles :
il voit les rejeux de tous les projets, de tous les clients. Décider s'il garde
ce pouvoir, et le dire explicitement dans le code plutôt que de le laisser être
un effet de bord.
