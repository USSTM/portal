CREATE TABLE "event_organizers" (
	"event_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	CONSTRAINT "event_organizers_event_id_club_id_pk" PRIMARY KEY("event_id","club_id")
);
--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;