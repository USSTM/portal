FROM node:24-alpine AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/auth/package.json apps/auth/package.json
COPY apps/portal/package.json apps/portal/package.json
COPY packages/auth-session/package.json packages/auth-session/package.json
RUN pnpm install --frozen-lockfile

COPY apps/portal apps/portal
COPY packages/auth-session packages/auth-session
RUN pnpm --filter @usstm/portal build

FROM build AS migrate

ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@usstm/portal", "db:migrate"]

FROM node:24-alpine AS runtime

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY --from=build /app/apps/portal/.output ./

USER node
CMD ["node", "server/index.mjs"]
