CREATE TABLE "room_b_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"start_hour" integer NOT NULL,
	"club_id" uuid,
	"member_id" uuid,
	"booked_by_member_id" uuid NOT NULL,
	"owner_label" text NOT NULL,
	"board_position" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_email" text,
	CONSTRAINT "room_b_bookings_exactly_one_owner" CHECK (("room_b_bookings"."club_id" IS NOT NULL) <> ("room_b_bookings"."member_id" IS NOT NULL)),
	CONSTRAINT "room_b_bookings_opening_hours" CHECK ("room_b_bookings"."start_hour" >= 8 AND "room_b_bookings"."start_hour" < 22),
	CONSTRAINT "room_b_bookings_owner_label_nonblank" CHECK (length(btrim("room_b_bookings"."owner_label")) > 0),
	CONSTRAINT "room_b_bookings_cancellation_attribution" CHECK (("room_b_bookings"."cancelled_at" IS NULL) = ("room_b_bookings"."cancelled_by_email" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "room_b_bookings" ADD CONSTRAINT "room_b_bookings_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_b_bookings" ADD CONSTRAINT "room_b_bookings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_b_bookings" ADD CONSTRAINT "room_b_bookings_booked_by_member_id_members_id_fk" FOREIGN KEY ("booked_by_member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "room_b_bookings_active_hour_unique" ON "room_b_bookings" USING btree ("date","start_hour") WHERE "room_b_bookings"."cancelled_at" IS NULL;--> statement-breakpoint
CREATE INDEX "room_b_bookings_club_date_idx" ON "room_b_bookings" USING btree ("club_id","date");--> statement-breakpoint
CREATE INDEX "room_b_bookings_member_date_idx" ON "room_b_bookings" USING btree ("member_id","date");