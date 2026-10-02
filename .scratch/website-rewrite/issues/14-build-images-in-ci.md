# 14 — Build production images in CI

**What to build:** Stop building images on the production host, where the website's `next build` needs about 8GB of memory. Build them in CI, push them to GHCR, and have the host only pull.

**Blocked by:** None — can start immediately

**Status:** needs-triage

- [ ] Decide on the registry, image tagging and the pull credentials on the host.
- [ ] On `main`, CI builds and pushes the `portal`, `auth`, `website` and migrate images.
- [ ] `compose.production.yaml` and `deploy.sh` pull tagged images instead of building them.
- [ ] The deployment tests cover the image references.
