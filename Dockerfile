FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM base AS production-deps

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev \
  && npm install --omit=dev --no-save prisma@5.22.0 \
  && npx prisma generate

FROM base AS production

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build /app/prisma/migrations ./prisma/migrations

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/index.js"]
