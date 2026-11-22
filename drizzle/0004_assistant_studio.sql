ALTER TABLE "agents" ADD COLUMN "published_version" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "tested_version" integer;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "agent_version" integer;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "needs_human" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "test_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "usage" jsonb;