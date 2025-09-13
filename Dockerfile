FROM node:18-alpine
WORKDIR /app/bugreveal/record
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:preprod
EXPOSE 5174
CMD ["node", "server.js"]
