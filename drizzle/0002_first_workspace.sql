ALTER TABLE "users" ADD COLUMN "home_business_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_home_business_id_businesses_id_fk" FOREIGN KEY ("home_business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "permissions" ("key") VALUES ('workspace.read') ON CONFLICT ("key") DO NOTHING;
