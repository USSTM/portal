# 13 — Move content collections into Page blocks

**What to build:** Turn the Committees, ElectionCycles, FAQ, GalleryImages and Documents collections into Page blocks, so that Payload only holds Pages, Media and site settings (ADR-0021).

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Committees, Elections, FAQ, Gallery and Documents blocks hold their content inline: plain names, photos, text, and files from Media.
- [ ] Committee members and election candidates are plain content and never reference Members.
- [ ] Existing records are migrated into blocks on the Pages that showed them.
- [ ] The five collections are removed with migrations.
