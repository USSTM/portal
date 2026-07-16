CREATE TYPE "public"."club_lifecycle" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "club_access" (
	"member_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	CONSTRAINT "club_access_member_id_club_id_pk" PRIMARY KEY("member_id","club_id")
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_name" text NOT NULL,
	"full_name" text NOT NULL,
	"contact_email" text,
	"lifecycle" "club_lifecycle" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_short_name_unique" UNIQUE("short_name")
);
--> statement-breakpoint
ALTER TABLE "club_access" ADD CONSTRAINT "club_access_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_access" ADD CONSTRAINT "club_access_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;