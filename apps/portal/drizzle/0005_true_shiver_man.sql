CREATE TABLE "board_members" (
	"member_id" uuid PRIMARY KEY NOT NULL,
	"board_position" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_members_position_nonblank" CHECK (length(btrim("board_members"."board_position")) > 0),
	CONSTRAINT "board_members_position_trimmed" CHECK ("board_members"."board_position" = btrim("board_members"."board_position"))
);
--> statement-breakpoint
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;