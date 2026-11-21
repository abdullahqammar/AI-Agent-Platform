CREATE TYPE "public"."appointment_status" AS ENUM('requested', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "agent_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	CONSTRAINT "agent_channels_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "agent_channels_business_id_agent_id_channel_id_unique" UNIQUE("business_id","agent_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "agent_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"identity" text NOT NULL,
	"instructions" text NOT NULL,
	"tone" text,
	"languages" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "agent_configurations_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "agent_configurations_business_id_agent_id_version_unique" UNIQUE("business_id","agent_id","version"),
	CONSTRAINT "agent_configuration_positive_version" CHECK ("agent_configurations"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "agent_configurations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	CONSTRAINT "agent_knowledge_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "agent_knowledge_business_id_agent_id_document_id_unique" UNIQUE("business_id","agent_id","document_id")
);
--> statement-breakpoint
ALTER TABLE "agent_knowledge" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_id" uuid NOT NULL,
	"tool_key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "agent_tools_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "agent_tools_business_id_agent_id_tool_key_unique" UNIQUE("business_id","agent_id","tool_key")
);
--> statement-breakpoint
ALTER TABLE "agent_tools" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "agents_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "appointment_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"status" "appointment_status" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_status_events_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "appointment_status_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"status" "appointment_status" DEFAULT 'requested' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	CONSTRAINT "appointments_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "appointment_time_order" CHECK ("appointments"."ends_at" > "appointments"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"membership_id" uuid,
	"action" text NOT NULL,
	"target_id" uuid,
	CONSTRAINT "audit_events_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "businesses" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "businesses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "channel_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider" text NOT NULL,
	"external_account_id" text NOT NULL,
	"credential_ref" text,
	CONSTRAINT "channel_connections_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "channel_connections_provider_external_account_id_unique" UNIQUE("provider","external_account_id"),
	CONSTRAINT "channel_connections_credential_ref_unique" UNIQUE("credential_ref"),
	CONSTRAINT "channel_credential_is_reference" CHECK ("channel_connections"."credential_ref" ~ ('^agentflow/channels/' || "channel_connections"."business_id"::text || '/' || "channel_connections"."id"::text || '$'))
);
--> statement-breakpoint
ALTER TABLE "channel_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversation_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "conversation_assignments_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "conversation_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"agent_id" uuid,
	"closed_at" timestamp with time zone,
	CONSTRAINT "conversations_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "conversations_business_id_id_channel_id_unique" UNIQUE("business_id","id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customer_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"external_customer_id" text NOT NULL,
	CONSTRAINT "customer_identities_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "customer_identities_business_id_channel_id_external_customer_id_unique" UNIQUE("business_id","channel_id","external_customer_id")
);
--> statement-breakpoint
ALTER TABLE "customer_identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	CONSTRAINT "customers_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"source_ref" text NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "knowledge_documents_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "knowledge_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "business_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"address" text,
	CONSTRAINT "business_locations_business_id_id_unique" UNIQUE("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "business_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "business_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "business_memberships_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "business_memberships_business_id_user_id_unique" UNIQUE("business_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "business_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_delivery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" uuid NOT NULL,
	"status" "delivery_status" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"provider_event_id" text,
	CONSTRAINT "message_delivery_events_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "message_delivery_events_business_id_message_id_provider_event_id_unique" UNIQUE("business_id","message_id","provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "message_delivery_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"external_message_id" text,
	"direction" "message_direction" NOT NULL,
	"body" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "messages_business_id_channel_id_external_message_id_unique" UNIQUE("business_id","channel_id","external_message_id")
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "permissions" (
	"key" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_key" text NOT NULL,
	CONSTRAINT "role_permissions_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "role_permissions_business_id_role_id_permission_key_unique" UNIQUE("business_id","role_id","permission_key")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "roles_business_id_id_unique" UNIQUE("business_id","id"),
	CONSTRAINT "roles_business_id_name_unique" UNIQUE("business_id","name")
);
--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tool_definitions" (
	"key" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_issuer" text NOT NULL,
	"identity_subject" text NOT NULL,
	CONSTRAINT "users_identity_issuer_identity_subject_unique" UNIQUE("identity_issuer","identity_subject")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_channels" ADD CONSTRAINT "agent_channels_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_channels" ADD CONSTRAINT "agent_channels_agent_tenant_fk" FOREIGN KEY ("business_id","agent_id") REFERENCES "public"."agents"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_channels" ADD CONSTRAINT "agent_channels_channel_tenant_fk" FOREIGN KEY ("business_id","channel_id") REFERENCES "public"."channel_connections"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_configurations" ADD CONSTRAINT "agent_configurations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_configurations" ADD CONSTRAINT "agent_configurations_agent_tenant_fk" FOREIGN KEY ("business_id","agent_id") REFERENCES "public"."agents"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_agent_tenant_fk" FOREIGN KEY ("business_id","agent_id") REFERENCES "public"."agents"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_document_tenant_fk" FOREIGN KEY ("business_id","document_id") REFERENCES "public"."knowledge_documents"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_tool_key_tool_definitions_key_fk" FOREIGN KEY ("tool_key") REFERENCES "public"."tool_definitions"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agent_tenant_fk" FOREIGN KEY ("business_id","agent_id") REFERENCES "public"."agents"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_events" ADD CONSTRAINT "appointment_status_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_events" ADD CONSTRAINT "appointment_status_events_appointment_tenant_fk" FOREIGN KEY ("business_id","appointment_id") REFERENCES "public"."appointments"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_tenant_fk" FOREIGN KEY ("business_id","customer_id") REFERENCES "public"."customers"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_location_tenant_fk" FOREIGN KEY ("business_id","location_id") REFERENCES "public"."business_locations"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_membership_tenant_fk" FOREIGN KEY ("business_id","membership_id") REFERENCES "public"."business_memberships"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_connections" ADD CONSTRAINT "channel_connections_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignments" ADD CONSTRAINT "conversation_assignments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignments" ADD CONSTRAINT "conversation_assignments_conversation_tenant_fk" FOREIGN KEY ("business_id","conversation_id") REFERENCES "public"."conversations"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignments" ADD CONSTRAINT "conversation_assignments_membership_tenant_fk" FOREIGN KEY ("business_id","membership_id") REFERENCES "public"."business_memberships"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversation_agent_channel_fk" FOREIGN KEY ("business_id","agent_id","channel_id") REFERENCES "public"."agent_channels"("business_id","agent_id","channel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_tenant_fk" FOREIGN KEY ("business_id","customer_id") REFERENCES "public"."customers"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_tenant_fk" FOREIGN KEY ("business_id","channel_id") REFERENCES "public"."channel_connections"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_identities" ADD CONSTRAINT "customer_identities_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_identities" ADD CONSTRAINT "customer_identities_customer_tenant_fk" FOREIGN KEY ("business_id","customer_id") REFERENCES "public"."customers"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_identities" ADD CONSTRAINT "customer_identities_channel_tenant_fk" FOREIGN KEY ("business_id","channel_id") REFERENCES "public"."channel_connections"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_role_tenant_fk" FOREIGN KEY ("business_id","role_id") REFERENCES "public"."roles"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_delivery_events" ADD CONSTRAINT "message_delivery_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_delivery_events" ADD CONSTRAINT "message_delivery_events_message_tenant_fk" FOREIGN KEY ("business_id","message_id") REFERENCES "public"."messages"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "message_conversation_channel_fk" FOREIGN KEY ("business_id","conversation_id","channel_id") REFERENCES "public"."conversations"("business_id","id","channel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_tenant_fk" FOREIGN KEY ("business_id","role_id") REFERENCES "public"."roles"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_status_events_business_id_appointment_id_occurred_at_index" ON "appointment_status_events" USING btree ("business_id","appointment_id","occurred_at");--> statement-breakpoint
CREATE INDEX "appointments_business_id_location_id_starts_at_index" ON "appointments" USING btree ("business_id","location_id","starts_at");--> statement-breakpoint
CREATE INDEX "audit_events_business_id_created_at_index" ON "audit_events" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "one_current_conversation_assignment" ON "conversation_assignments" USING btree ("business_id","conversation_id") WHERE "conversation_assignments"."ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "conversation_assignments_business_id_membership_id_index" ON "conversation_assignments" USING btree ("business_id","membership_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_business_id_status_index" ON "knowledge_documents" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "business_memberships_user_id_index" ON "business_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_delivery_events_business_id_message_id_occurred_at_index" ON "message_delivery_events" USING btree ("business_id","message_id","occurred_at");--> statement-breakpoint
CREATE INDEX "messages_business_id_conversation_id_occurred_at_index" ON "messages" USING btree ("business_id","conversation_id","occurred_at");
--> statement-breakpoint
ALTER TABLE "businesses" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "businesses" USING ("id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "users" USING ("identity_issuer" = current_setting('agentflow.identity_issuer', true) AND "identity_subject" = current_setting('agentflow.identity_subject', true));
--> statement-breakpoint
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "roles" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "role_permissions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "role_permissions" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "business_memberships" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "business_memberships" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "business_locations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "business_locations" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "agents" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "agents" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "agent_configurations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "agent_configurations" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "agent_tools" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "agent_tools" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "channel_connections" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "channel_connections" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "agent_channels" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "agent_channels" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "customers" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "customer_identities" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "customer_identities" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "conversations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "conversations" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "messages" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "message_delivery_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "message_delivery_events" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "conversation_assignments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "conversation_assignments" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "knowledge_documents" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "knowledge_documents" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "agent_knowledge" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "agent_knowledge" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "appointments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "appointments" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "appointment_status_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "appointment_status_events" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "audit_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "agentflow_scope" ON "audit_events" USING ("business_id" = nullif(current_setting('agentflow.business_id', true), '')::uuid);
--> statement-breakpoint
CREATE FUNCTION public.agentflow_validate_timezone() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.timezone <> 'UTC' AND (
    position('/' in NEW.timezone) = 0 OR
    NEW.timezone ~ '^(posix|right)/' OR
    NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW.timezone)
  ) THEN
    RAISE EXCEPTION 'Expected an IANA timezone identifier' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "validate_timezone" BEFORE INSERT OR UPDATE OF timezone ON "businesses"
FOR EACH ROW EXECUTE FUNCTION public.agentflow_validate_timezone();
--> statement-breakpoint
CREATE TRIGGER "validate_timezone" BEFORE INSERT OR UPDATE OF timezone ON "business_locations"
FOR EACH ROW EXECUTE FUNCTION public.agentflow_validate_timezone();
--> statement-breakpoint
CREATE TRIGGER "validate_timezone" BEFORE INSERT OR UPDATE OF timezone ON "appointments"
FOR EACH ROW EXECUTE FUNCTION public.agentflow_validate_timezone();
