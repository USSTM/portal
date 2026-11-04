ALTER TABLE "members" ADD COLUMN "photo_id" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_bio_length" CHECK ("members"."bio" is null or length("members"."bio") between 1 and 500);