ALTER TABLE "clubs" ADD CONSTRAINT "clubs_short_name_nonblank" CHECK (length(btrim("clubs"."short_name")) > 0);--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_short_name_trimmed" CHECK ("clubs"."short_name" = btrim("clubs"."short_name"));--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_full_name_nonblank" CHECK (length(btrim("clubs"."full_name")) > 0);