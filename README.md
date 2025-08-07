Tous le projets back, front, record nécessite l'installation de npm (npm install)

# Technologies utilisées : EXPRESS JS, VUE JS, JAVASCRIPT, RRWEB

# 📦 Backend - Session Record & Error Tracking

Ce projet Node.js utilise Express, MongoDB, Redis, BullMQ et AWS S3 pour enregistrer et analyser les sessions des utilisateurs et leurs erreurs. Il fonctionne en synergie avec un frontend (Vue.js) et un enregistreur de sessions (`record`).

---

## ⚙️ Configuration `.env`

Le backend **nécessite un fichier `.env`** à la racine du projet contenant les variables suivantes :

```env
# Serveur principal
PORT=3000
HOST=127.0.0.1

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DEFAULT_CACHE_EXPIRATION=7200

# Record Service (microservice de session)
RECORD_HOST=localhost
RECORD_PORT=5174

# Base de données MongoDB
DB_USER=admin
DB_PASSWORD=admin
DB_CLUSTER_URL=localhost:27017
DB_CLUSTER=retrymap
ENVIRONMENT=local

# Email (ex: Mailtrap)
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=396472932d0a53
MAIL_PASSWORD=5df4ee1ed73260
MAIL_ENCRYPTION=tls
# MAIL_FROM=
MAIL_FROM_NAME="Karel TOWANOU"

# Authentification JWT
SECRET_KEY=
REFRESH_KEY=

# AWS S3 (stockage des sessions enregistrées)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=
AWS_URL=
AWS_URL_FILE=

# Clés de chiffrement (utilisées pour sécuriser certaines données)
encrypted_key_hash=
iv_key_hash=

# Elasticsearch (surveillance des erreurs)
ELASTIC_URL=
ELASTIC_API_KEY=


Démarrage des services
Avant de lancer l'application, assure-toi que tous les services nécessaires sont actifs.

1. Lancer MongoDB
MongoDB doit être actif sur localhost:27017. Utilise un service local ou Docker.

2. Lancer Redis
Redis doit être en fonctionnement sur le port 6379.

3. Lancer le microservice record
npm install
npm run dev
Ce service tourne par défaut sur le port 5174.

4. Lancer le frontend

npm install
npm run dev

5. Lancer le backend

npm install
npm run dev
🔥 Adapte la configuration du .env du frontend pour pointer vers le bon port.

6. Lancer les workers BullMQ (pour la queue)
Deux commandes sont à exécuter pour activer les workers qui traitent les sessions et erreurs (dans le projet BACK)

npm run listener
npm run worker

🧠 Fonctionnement général
Création de compte via le frontend

Une fois connecté, l'utilisateur peut créer un projet

Après création, un script de tracking est généré

Ce script doit être inséré dans le footer du site que l’on souhaite analyser

Le script enregistre :

#Les erreurs JS (console.error, ReferenceError, etc.)

#Les erreurs de promesses (unhandledrejection)

#Les rage clicks

# Détecte s'il s'agit d'un nouvel utilisateur qui atteri sur le site via un cookie de 365 jours

# Les erreurs sont : Stockées dans MongoDB , bientôt dans ELASTICSEARCH

# Les sessions sont envoyées et stockées sur AWS S3

🔁 Stockage et queue
Le projet utilise BullMQ pour traiter et stocker les sessions enregistrées de manière asynchrone. Les workers doivent être lancés pour que cela fonctionne correctement.

✅ Exigences système
Node.js ≥ v18

Redis

MongoDB

Compte AWS (ou équivalent compatible S3)

Elasticsearch (facultatif)
