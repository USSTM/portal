CREATE TYPE "public"."board_archive_source" AS ENUM('portal', 'legacy_import');--> statement-breakpoint
CREATE TABLE "board_archive_entries" (
	"archive_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"display_name" text NOT NULL,
	"board_position" text NOT NULL,
	CONSTRAINT "board_archive_entries_archive_id_position_pk" PRIMARY KEY("archive_id","position"),
	CONSTRAINT "board_archive_entries_display_name_nonblank" CHECK (length(btrim("board_archive_entries"."display_name")) > 0),
	CONSTRAINT "board_archive_entries_board_position_nonblank" CHECK (length(btrim("board_archive_entries"."board_position")) > 0)
);
--> statement-breakpoint
CREATE TABLE "board_archives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_year" text NOT NULL,
	"source" "board_archive_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_archives_academic_year_unique" UNIQUE("academic_year"),
	CONSTRAINT "board_archives_academic_year_format" CHECK ("board_archives"."academic_year" ~ '^[0-9]{4}-[0-9]{4}$' and split_part("board_archives"."academic_year", '-', 2)::int = split_part("board_archives"."academic_year", '-', 1)::int + 1)
);
--> statement-breakpoint
ALTER TABLE "board_archive_entries" ADD CONSTRAINT "board_archive_entries_archive_id_board_archives_id_fk" FOREIGN KEY ("archive_id") REFERENCES "public"."board_archives"("id") ON DELETE restrict ON UPDATE no action;