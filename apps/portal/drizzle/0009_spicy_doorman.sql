CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"date" date NOT NULL,
	"shift_slot_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"board_position" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_member_date_slot_unique" UNIQUE("member_id","date","shift_slot_id")
);
--> statement-breakpoint
CREATE TABLE "shift_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "shift_slots_start_end_unique" UNIQUE("start_time","end_time"),
	CONSTRAINT "shift_slots_end_after_start" CHECK ("shift_slots"."end_time" > "shift_slots"."start_time")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shift_slot_id_shift_slots_id_fk" FOREIGN KEY ("shift_slot_id") REFERENCES "public"."shift_slots"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "shift_slots" ("start_time", "end_time") VALUES
  ('10:00', '12:00'),
  ('12:00', '14:00'),
  ('14:00', '16:00'),
  ('16:00', '18:00');
