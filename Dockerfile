FROM node:18-alpine
WORKDIR /app/bugreveal/record
COPY package*.json ./
RUN npm install
COPY . .
# Les variables VITE_* sont figées dans le bundle au moment du build, pas au
# lancement du conteneur : impossible de les faire varier via env_file/environment
# dans docker-compose comme pour un serveur classique. Le mode de build doit donc
# être choisi ici, via ce build arg (passé différemment par chaque docker-compose
# selon la cible : local par défaut, "preprod" pour docker-compose-devs.yaml).
ARG BUILD_MODE=local
RUN if [ "$BUILD_MODE" = "local" ]; then npm run build; else npm run build -- --mode $BUILD_MODE; fi
EXPOSE 5174
CMD ["node", "server.js"]
