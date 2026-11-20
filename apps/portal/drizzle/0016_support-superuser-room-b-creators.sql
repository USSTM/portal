ALTER TABLE "room_b_bookings" ADD COLUMN "booked_by_email" text;--> statement-breakpoint
UPDATE "room_b_bookings" AS booking
SET "booked_by_email" = member."email"
FROM "members" AS member
WHERE booking."booked_by_member_id" = member."id";--> statement-breakpoint
ALTER TABLE "room_b_bookings" ALTER COLUMN "booked_by_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "room_b_bookings" ALTER COLUMN "booked_by_member_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "room_b_bookings" ADD CONSTRAINT "room_b_bookings_creator_email_normalized" CHECK (length(btrim("room_b_bookings"."booked_by_email")) > 0 AND "room_b_bookings"."booked_by_email" = lower(btrim("room_b_bookings"."booked_by_email")));
