CREATE TABLE "catalogue_refreshes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"source_revision" integer NOT NULL,
	"previous_items" jsonb NOT NULL,
	"previous_import" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added" integer NOT NULL,
	"changed" integer NOT NULL,
	"removed" integer NOT NULL,
	CONSTRAINT "catalogue_refreshes_business_id_document_id_source_revision_unique" UNIQUE("business_id","document_id","source_revision")
);
--> statement-breakpoint
ALTER TABLE "catalogue_refreshes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "catalogue_refreshes" ADD CONSTRAINT "catalogue_refreshes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_refreshes" ADD CONSTRAINT "catalogue_refresh_source_fk" FOREIGN KEY ("business_id","document_id") REFERENCES "public"."knowledge_documents"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_refreshes" ADD CONSTRAINT "catalogue_refresh_actor_fk" FOREIGN KEY ("business_id","membership_id") REFERENCES "public"."business_memberships"("business_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE catalogue_refreshes FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY agentflow_scope ON catalogue_refreshes USING (business_id = nullif(current_setting('agentflow.business_id', true),'')::uuid);
