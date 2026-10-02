# 03 — Cut over the Website from Supabase

**What to build:** Move existing Website content off Supabase: database rows into the self-hosted `usstm_website` database and media into an AWS S3 bucket, then retire Supabase.

**Blocked by:** 01 — Move the Website into the monorepo

**Status:** ready-for-human

- [ ] The production `usstm_website` role and database exist (manual step in `docs/production-deployment.md` for the existing volume).
- [ ] A `pg_dump --no-owner --no-acl` of the Supabase database is restored into `usstm_website`, and `payload migrate:status` is clean afterwards.
- [ ] Every object in the Supabase storage bucket is copied to the AWS S3 bucket under the same `media/` keys; the `S3_*` production variables point at it.
- [ ] Spot-checked Pages render with their images through `/api/media/file/*`.
- [ ] DNS for `WEBSITE_ADDRESS` points at the production host and Caddy has issued a certificate.
- [ ] Supabase database and storage credentials are rotated or the project is deleted.
