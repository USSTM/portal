# Use a self-hosted central auth service

USSTM applications may be deployed separately but will share a self-hosted auth service built with Better Auth. The service will use Google as the upstream identity provider, remain the source of truth for Clubs, Access Grants, and USSTM Administrator authority, and act as an OAuth 2.1/OpenID Connect provider for registered USSTM applications rather than using a custom protocol or managed identity service. This keeps access policy under USSTM control while allowing future USSTM-operated applications to reuse one identity and authorization system.
