ALTER TABLE "agents" ADD COLUMN "access_generation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "catalogue_items" jsonb;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD COLUMN "disconnected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "access_generation" integer DEFAULT 0 NOT NULL;