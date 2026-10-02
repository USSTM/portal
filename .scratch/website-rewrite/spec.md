# Website Rewrite Specification

This specification moves the public USSTM Website, a Next.js and Payload CMS rewrite, into the Portal monorepo. It then makes the Portal the source of truth for every structured record the Website shows, leaving Payload only for building Pages.

Domain language is defined in [`CONTEXT.md`](../../CONTEXT.md). The rationale is in [ADR-0018](../../docs/adr/0018-add-a-payload-public-website-app.md) (the website app), [ADR-0019](../../docs/adr/0019-adopt-turborepo-for-workspace-tasks.md) (Turborepo), [ADR-0020](../../docs/adr/0020-add-a-content-manager-grant.md) (the Content Manager grant) and [ADR-0021](../../docs/adr/0021-keep-structured-data-in-the-portal.md) (the Portal owns structured data).

## Goals

- Run the Website as `apps/website` in the Portal workspace, deployed on the same Compose stack behind Caddy.
- Leave Supabase completely: content moves into the self-hosted `usstm_website` database and media into an AWS S3 bucket.
- Give the Website one identity system: Content Managers sign in to Payload through the shared auth service.
- Keep one copy of every structured record. Events, Clubs and their Club Profiles, Member Profiles, Board Members and Board Archives live in the Portal, and the Website reads them through public Portal endpoints.
- Keep CI green and fast as the workspace grows.

## Non-goals

- Storing committee members or election candidates as Members.
- Letting Clubs build their own Website Pages.
- Retaining photos in Board Archives.
- A draft or preview workflow for Portal-owned records.

## Ownership

| Record | Owner | Edited by |
| --- | --- | --- |
| Events | Portal | Club Access holders of the Owning Club, Administrators |
| Club, Club Profile (image, description, type, links) | Portal | Club Profile: that Club's Club Access holders and Administrators. Name and lifecycle: Administrators |
| Member Profile (photo, bio) | Portal | The Member themselves |
| Board Members, Board Positions | Portal | Administrators |
| Board Archives | Portal | Administrators (archive action, legacy import) |
| Pages, including Committees, Elections, FAQ, Gallery and Documents blocks | Payload | Content Managers |
| Media, site settings (navigation, footer, socials) | Payload | Content Managers |

## Public visibility

- Archived Clubs are not shown on the Website.
- A Member Profile is public only while the Member is a Board Member.
- A Board Archive holds names and Board Positions only, never links to Members or photos.
- Portal endpoints for the Website follow the Events API conventions (ADR-0005): versioned under `/api/v1`, unauthenticated, `GET`/`HEAD` only, CORS for any origin, a short public cache, and no personal audit data. Each contract is documented in `docs/api/` with its issue.
- The Website degrades to an empty state when the Portal is unavailable.

## Delivery

Work is tracked in [`issues/`](./issues/). The phases are: the move and cutover (01–04), Content Manager authority and Payload sign-in (05–06), Clubs (07–08), the board (09–12), Page blocks (13), and workspace tooling (14–15). Until a phase ships, its Payload collection stays in place.
