# Deploy independent services on one host first

The initial production deployment will run Caddy, the auth service, the portal service, and PostgreSQL through Docker Compose on one USSTM-controlled Linux host. `auth.usstm.ca` and `portal.usstm.ca` will use separate host-only secure cookies, and PostgreSQL will remain private to the internal network. Each application will retain its own image, configuration, database ownership, and deployment artifact so services can move to separate hosts later without redesigning their boundaries.
