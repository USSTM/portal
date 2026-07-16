# Reuse auth with independent application sessions

The central auth microservice may be reverse-proxied at `/auth/*` on multiple allowlisted application origins. It performs the Google authentication flow for each application, but every application receives a host-only session and independently authorizes the verified email against its own data. The system deliberately does not provide cross-domain SSO or act as a general OIDC provider, avoiding shared cookies and identity-provider complexity while keeping the Google integration reusable.

Each session is a stateless, host-only, secure, HTTP-only cookie containing only the normalized verified email, intended application audience, and issued and expiry timestamps. The auth service signs it with a private key and applications verify it with the corresponding public key. Applications re-check current database authorization on every protected server request, so no shared session table or revocation protocol is required and authorization changes take effect immediately.

Sessions expire after eight hours without sliding renewal, refresh tokens, or a remember-me option. The auth service does not retain Google access or refresh tokens because the verified email is the only upstream identity claim the applications require.

The service will use Hono on Node.js, Arctic for Google's authorization-code flow with PKCE, Google's user-info endpoint for the verified email, and `jose` for asymmetric cookie signing. It will not use a database, ORM, general-purpose authentication framework, or plugin system.

Google account domains provide no authority. Each application admits a normalized verified email only when it exactly matches an active, pre-provisioned Member or that application's configured Superuser.

Reusable application clients are registered through deployment configuration with a stable client ID, exact public origin, cookie audience and name, and callback path. The auth service rejects unknown clients, hosts, and callback destinations, and accepts only relative post-login paths on the registered origin. It will not provide a database-backed or administrator-managed client registry.

The auth service receives one private signing key, while every application receives only the matching public verification key and key ID through deployment configuration. Initial key rotation is a coordinated deployment; the system does not expose JWKS discovery or implement multi-key rotation machinery.
