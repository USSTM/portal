import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "content_managers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "content_managers_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "content_managers_id" integer;
  CREATE UNIQUE INDEX "content_managers_email_idx" ON "content_managers" USING btree ("email");
  CREATE INDEX "content_managers_updated_at_idx" ON "content_managers" USING btree ("updated_at");
  CREATE INDEX "content_managers_created_at_idx" ON "content_managers" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_managers_fk" FOREIGN KEY ("content_managers_id") REFERENCES "public"."content_managers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_content_managers_fk" FOREIGN KEY ("content_managers_id") REFERENCES "public"."content_managers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_content_managers_id_idx" ON "payload_locked_documents_rels" USING btree ("content_managers_id");
  CREATE INDEX "payload_preferences_rels_content_managers_id_idx" ON "payload_preferences_rels" USING btree ("content_managers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Reordered from the generated SQL so the constraints are dropped before the
  // table whose CASCADE would already have removed them.
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_content_managers_fk";
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_content_managers_fk";
  DROP INDEX "payload_locked_documents_rels_content_managers_id_idx";
  DROP INDEX "payload_preferences_rels_content_managers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "content_managers_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "content_managers_id";
  ALTER TABLE "content_managers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "content_managers" CASCADE;`)
}
