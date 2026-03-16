FROM node:22-alpine

RUN apk upgrade --no-cache && adduser -D -u 1001 appuser

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

RUN chown -R appuser:appuser /app /tmp

USER 1001

EXPOSE 8080

CMD ["node", "server.js"]
