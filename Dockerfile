FROM node:18-alpine
WORKDIR /app/replaymap/back
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm run db:seed && npm run dev"]