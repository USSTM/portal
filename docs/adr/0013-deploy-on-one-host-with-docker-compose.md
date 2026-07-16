# Deploy on one host with Docker Compose

The initial production system will run Caddy, the portal, the auth service, and PostgreSQL as separate Docker Compose services on one USSTM-controlled Linux host. Caddy alone exposes public ports and routes `/auth/*` to the otherwise private auth service; PostgreSQL uses persistent storage and nightly encrypted off-host backups. This retains clear service and data boundaries without introducing Kubernetes or cloud-specific infrastructure.

The portal container uses TanStack Start's pinned Nitro Node preset and generated production server. The system will not wrap TanStack Start in a custom Node HTTP server.
