FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter auth build

FROM node:22-alpine

WORKDIR /app/apps/auth
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/auth/node_modules ./node_modules
COPY --from=build /app/apps/auth/dist ./dist
COPY --from=build /app/apps/auth/migrations ./migrations
COPY --from=build /app/apps/auth/package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/server.js"]
