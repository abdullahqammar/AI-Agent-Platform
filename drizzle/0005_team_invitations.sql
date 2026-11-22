CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "workspace_invitations_business_id_email_unique" UNIQUE("business_id","email"),
	CONSTRAINT "invitation_role" CHECK ("workspace_invitations"."role" in ('Viewer','Assistant manager')),
	CONSTRAINT "invitation_status" CHECK ("workspace_invitations"."status" in ('pending','accepted','declined','revoked'))
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE workspace_invitations FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY agentflow_scope ON workspace_invitations USING (business_id = nullif(current_setting('agentflow.business_id', true),'')::uuid);
