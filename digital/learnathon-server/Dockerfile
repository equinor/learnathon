FROM node:22-alpine

RUN adduser -D -u 1001 appuser

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

RUN chown -R appuser:appuser /app /tmp

USER appuser

EXPOSE 8080

CMD ["node", "server.js"]
