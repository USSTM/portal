CREATE TYPE "public"."resource_category" AS ENUM('finance', 'operations');--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "resource_category" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"display_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_title_nonblank" CHECK (length(btrim("resources"."title")) > 0),
	CONSTRAINT "resources_description_nonblank" CHECK (length(btrim("resources"."description")) > 0),
	CONSTRAINT "resources_url_https" CHECK ("resources"."url" ~ '^https://')
);
--> statement-breakpoint
INSERT INTO "resources" ("category", "title", "description", "url", "display_order") VALUES
  ('finance', 'Budget Request Template', 'Submit the budget request template to the finance team for review and approval of your projected expenses for the semester or year.', 'https://docs.google.com/spreadsheets/d/1nv6X_KiiyQVGBtFCUSAApTB9GCCBoOvMehxbx2q3rDw/edit?gid=0#gid=0', 1),
  ('finance', 'Reimbursement Request Form', 'Request reimbursement for out-of-pocket expenses incurred on behalf of USSTM.', 'https://form.asana.com/?k=zhISKZfwA_Q6kCoEJien9g&d=1207498115170020', 2),
  ('finance', 'Internal Invoices Form', 'Submit this form for internal transactions within TMU that require invoicing and do not currently have an invoice.', 'https://form.asana.com/?k=1NQgBEjWG1VBGSkzSBK0hA&d=1207498115170020', 3),
  ('finance', 'External Invoices Form', 'Submit this form for external transactions that require invoicing and do not currently have an invoice.', 'https://form.asana.com/?k=PzlZ-m9kEK2CvwGxs6Y0cg&d=1207498115170020', 4),
  ('finance', 'P-Card Request Form', 'Request use of the purchasing card for approved transactions so USSTM purchases it on your behalf.', 'https://form.asana.com/?k=QT1kvTNB3yNyBEZY0wDjUA&d=1207498115170020', 5),
  ('operations', 'Resource Sheet', 'Access the comprehensive list of general event supplies USSTM offers including cups, garbage bags, plates, utensils, media services, carts, tables, and chairs.', 'https://docs.google.com/spreadsheets/d/1Qa1UsFtjEiqlM6eEtCvIqwAfujF_u0-C/edit?usp=sharing&ouid=107751479446945748540&rtpof=true&sd=true', 1),
  ('operations', 'Event Supplies & Request Form', 'Request supplies available for sign-out only, including craft supplies, board games, decorations, and more.', 'https://docs.google.com/forms/d/e/1FAIpQLSdQdvJO6K7V5Q6g5a7EBl_Oq86uMi7MH7052iAKzHPnqC12aQ/viewform', 2),
  ('operations', 'Science Lounge Booking Form', 'Request to book the Science Lounge for your group''s events. Each student group may only book the space twice per month.', 'https://form.asana.com/?k=FNNzzwHAohuUc_jfYcWS3w&d=1207498115170020', 3),
  ('operations', 'Graphics Request Form', 'Request graphics for social media purposes at least ten days in advance with enough information to create them.', 'https://form.asana.com/?k=PvdgW4DrqC5iuVA7TnHZow&d=1207498115170020', 4);
