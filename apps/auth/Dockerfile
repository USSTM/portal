FROM node:24-alpine AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/auth/package.json apps/auth/package.json
COPY apps/portal/package.json apps/portal/package.json
COPY packages/auth-session/package.json packages/auth-session/package.json
RUN pnpm install --frozen-lockfile

COPY apps/auth apps/auth
COPY packages/auth-session packages/auth-session
RUN pnpm --filter @usstm/auth build

FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/auth/dist apps/auth/dist
COPY --from=build /app/apps/auth/node_modules apps/auth/node_modules
COPY --from=build /app/apps/auth/package.json apps/auth/package.json
COPY --from=build /app/packages/auth-session packages/auth-session

USER node
CMD ["node", "apps/auth/dist/src/server.js"]
