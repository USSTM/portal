CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"address" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"owning_club_id" uuid NOT NULL,
	"creator_member_id" uuid,
	"last_editor_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_title_nonblank" CHECK (length(btrim("events"."title")) > 0),
	CONSTRAINT "events_description_nonblank" CHECK (length(btrim("events"."description")) > 0),
	CONSTRAINT "events_location_nonblank" CHECK (length(btrim("events"."location")) > 0),
	CONSTRAINT "events_address_nonblank" CHECK (length(btrim("events"."address")) > 0),
	CONSTRAINT "events_end_after_start" CHECK ("events"."end_at" >= "events"."start_at" + interval '1 hour')
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_owning_club_id_clubs_id_fk" FOREIGN KEY ("owning_club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_member_id_members_id_fk" FOREIGN KEY ("creator_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_last_editor_member_id_members_id_fk" FOREIGN KEY ("last_editor_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;