FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server.js"]
