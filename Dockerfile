FROM node:18-alpine
WORKDIR /app/replaymap/record
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5374
CMD [ "npm run dev" ]