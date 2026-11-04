CREATE TYPE "public"."club_type" AS ENUM('student_group', 'course_union');--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "type" "club_type";--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "instagram_handle" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "image_id" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_description_length" CHECK ("clubs"."description" is null or length("clubs"."description") between 1 and 1000);--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_instagram_handle_format" CHECK ("clubs"."instagram_handle" is null or "clubs"."instagram_handle" ~ '^[A-Za-z0-9._]{1,30}$');--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_website_url_https" CHECK ("clubs"."website_url" is null or "clubs"."website_url" ~ '^https://');