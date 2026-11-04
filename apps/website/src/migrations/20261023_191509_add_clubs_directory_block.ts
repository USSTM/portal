import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_clubs_directory_club_type" AS ENUM('all', 'student_group', 'course_union');
  CREATE TABLE "pages_blocks_clubs_directory" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"club_type" "enum_pages_blocks_clubs_directory_club_type" DEFAULT 'all',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_clubs_directory" ADD CONSTRAINT "pages_blocks_clubs_directory_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_clubs_directory_order_idx" ON "pages_blocks_clubs_directory" USING btree ("_order");
  CREATE INDEX "pages_blocks_clubs_directory_parent_id_idx" ON "pages_blocks_clubs_directory" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_clubs_directory_path_idx" ON "pages_blocks_clubs_directory" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_clubs_directory" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_clubs_directory_club_type";`)
}
