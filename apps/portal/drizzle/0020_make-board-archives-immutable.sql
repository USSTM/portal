-- Board Archives are frozen records (ticket 11): rows may be inserted, never
-- changed or deleted. TRUNCATE is left alone so test databases can be reset.
CREATE FUNCTION "reject_board_archive_change"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Board Archives cannot be edited or deleted'
    USING ERRCODE = 'restrict_violation';
END;
$$;--> statement-breakpoint
CREATE TRIGGER "board_archives_immutable"
  BEFORE UPDATE OR DELETE ON "board_archives"
  FOR EACH ROW EXECUTE FUNCTION "reject_board_archive_change"();--> statement-breakpoint
CREATE TRIGGER "board_archive_entries_immutable"
  BEFORE UPDATE OR DELETE ON "board_archive_entries"
  FOR EACH ROW EXECUTE FUNCTION "reject_board_archive_change"();
