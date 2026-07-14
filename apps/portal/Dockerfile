FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter portal build

FROM node:22-alpine

WORKDIR /app/apps/portal
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/portal/node_modules ./node_modules
COPY --from=build /app/apps/portal/dist ./dist
COPY --from=build /app/apps/portal/migrations ./migrations
EXPOSE 3000
CMD ["node", "node_modules/srvx/bin/srvx.mjs", "--dir", ".", "--entry", "dist/server/server.js", "--static", "dist/client", "--prod"]
