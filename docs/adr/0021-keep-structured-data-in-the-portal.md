# Keep structured data in the Portal; Payload only builds pages

The Portal is the single source of truth for structured USSTM data that the Website shows: Events, Clubs and their Club Profiles, Member Profiles, Board Members with their Board Positions, and Board Archives. The Website reads these through versioned, unauthenticated Portal endpoints, following the pattern of the Events API (ADR-0005), and keeps no copies. Payload CMS is used only to build and edit Pages, Media, and site settings.

The rewrite originally modelled Events, Student Groups, People, Board History, Committees, and Elections as Payload collections. That duplicated records the Portal already governs, and it put public data outside the authorization and audit rules the Portal enforces. The Portal now owns every record that has authority or identity behind it. Content with no Portal meaning becomes Page blocks edited by Content Managers: Committees, Elections, FAQ, Gallery, and Documents. Committee members and election candidates are plain public content, not Members.

A Board Archive is a frozen snapshot of names and Board Positions, made in the Portal at the end of an academic year. It refers to no Members, so legacy boards import in the same form, and a graduated Member's photo is never retained in history. A Member Profile is public only while that Member is a Board Member.

The cost is Portal schema, admin UI, and public endpoints for each moved entity. This is delivered in phases. Until a phase ships, its Payload collection stays in place.
