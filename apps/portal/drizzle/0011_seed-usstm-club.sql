-- Seeds the single protected Club representing USSTM itself. Fixed id so every
-- environment (including representative test fixtures re-seeded after a TRUNCATE)
-- can reference the same row. See ADR-0016.
INSERT INTO "clubs" ("id", "short_name", "full_name", "contact_email", "lifecycle", "protected")
VALUES ('51c3e4b2-350c-4654-b5c4-bf0411ec738e', 'USSTM', 'USSTM', NULL, 'active', true)
ON CONFLICT ("id") DO NOTHING;
