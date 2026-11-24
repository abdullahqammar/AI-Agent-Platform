ALTER TABLE "knowledge_documents" ADD COLUMN "library_key" uuid;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "revision" integer;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "workspace_fact_revision" UNIQUE("business_id","library_key","revision");