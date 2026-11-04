import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The Team Grid block now shows the current board from the Portal (ticket 12)
// instead of hand-picked People, so its People relationships and contact
// option go. The relationship rows are deleted before their column, since
// they would otherwise be left pointing at nothing.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "pages_rels" WHERE "people_id" IS NOT NULL;
   CREATE TABLE "pages_blocks_past_boards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_people_fk";
  
  DROP INDEX "pages_rels_people_id_idx";
  ALTER TABLE "pages_blocks_past_boards" ADD CONSTRAINT "pages_blocks_past_boards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_past_boards_order_idx" ON "pages_blocks_past_boards" USING btree ("_order");
  CREATE INDEX "pages_blocks_past_boards_parent_id_idx" ON "pages_blocks_past_boards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_past_boards_path_idx" ON "pages_blocks_past_boards" USING btree ("_path");
  ALTER TABLE "pages_blocks_team_grid" DROP COLUMN "show_contact_info";
  ALTER TABLE "pages_rels" DROP COLUMN "people_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_past_boards" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_past_boards" CASCADE;
  ALTER TABLE "pages_blocks_team_grid" ADD COLUMN "show_contact_info" boolean DEFAULT true;
  ALTER TABLE "pages_rels" ADD COLUMN "people_id" integer;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_people_id_idx" ON "pages_rels" USING btree ("people_id");`)
}
