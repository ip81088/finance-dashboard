FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN rm -rf node_modules && npm ci --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/drizzle ./drizzle

COPY deploy/init-db.mjs ./init-db.mjs
COPY deploy/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

RUN mkdir -p /data

EXPOSE 3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./entrypoint.sh"]
