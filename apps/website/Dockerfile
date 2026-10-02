FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS prune
COPY . .
RUN pnpm dlx turbo@2.11.5 prune @usstm/website --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @usstm/website build

FROM build AS migrate
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@usstm/website", "migrate"]

FROM node:24-alpine AS runtime
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /app/apps/website/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/website/.next/static ./apps/website/.next/static

USER node
CMD ["node", "apps/website/server.js"]
