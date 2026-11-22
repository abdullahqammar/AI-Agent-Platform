import { sql } from "drizzle-orm";
import {
  boolean, check, foreignKey, index, integer, jsonb, pgEnum, pgTable,
  text, timestamp, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").defaultRandom().primaryKey();
const instant = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => instant("created_at").notNull().defaultNow();
const businessId = () => uuid("business_id").notNull().references(() => businesses.id);

export const direction = pgEnum("message_direction", ["inbound", "outbound"]);
export const deliveryStatus = pgEnum("delivery_status", ["queued", "sent", "delivered", "read", "failed"]);
export const documentStatus = pgEnum("document_status", ["pending", "processing", "ready", "failed"]);
export const appointmentStatus = pgEnum("appointment_status", ["requested", "confirmed", "completed", "cancelled"]);

export const businesses = pgTable("businesses", {
  createdAt: createdAt(),
  id: id(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  description: text("description"),
}).enableRLS();

export const users = pgTable("users", {
  createdAt: createdAt(),
  id: id(),
  identityIssuer: text("identity_issuer").notNull(),
  identitySubject: text("identity_subject").notNull(),
  homeBusinessId: uuid("home_business_id").references(() => businesses.id),
}, (t) => [
  unique().on(t.identityIssuer, t.identitySubject),
]).enableRLS();

export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
});

export const roles = pgTable("roles", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  name: text("name").notNull(),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.name),
]).enableRLS();

export const rolePermissions = pgTable("role_permissions", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  roleId: uuid("role_id").notNull(),
  permissionKey: text("permission_key").notNull().references(() => permissions.key),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.roleId, t.permissionKey),
  foreignKey({
    name: "role_permissions_role_tenant_fk",
    columns: [t.businessId, t.roleId],
    foreignColumns: [roles.businessId, roles.id],
  }),
]).enableRLS();

export const memberships = pgTable("business_memberships", {
  displayName: text("display_name"),
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  userId: uuid("user_id").notNull().references(() => users.id),
  roleId: uuid("role_id").notNull(),
  active: boolean("active").notNull().default(true),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.userId),
  index().on(t.userId),
  foreignKey({
    name: "business_memberships_role_tenant_fk",
    columns: [t.businessId, t.roleId],
    foreignColumns: [roles.businessId, roles.id],
  }),
]).enableRLS();

export const locations = pgTable("business_locations", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  address: text("address"),
}, (t) => [
  unique().on(t.businessId, t.id),
]).enableRLS();

export const agents = pgTable("agents", {
  publishedVersion: integer("published_version"),
  testedVersion: integer("tested_version"),
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
}, (t) => [
  unique().on(t.businessId, t.id),
]).enableRLS();

export const agentConfigurations = pgTable("agent_configurations", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  agentId: uuid("agent_id").notNull(),
  version: integer("version").notNull(),
  identity: text("identity").notNull(),
  instructions: text("instructions").notNull(),
  tone: text("tone"),
  languages: text("languages").array().notNull().default(sql`ARRAY[]::text[]`),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.agentId, t.version),
  check("agent_configuration_positive_version", sql`${t.version} > 0`),
  foreignKey({
    name: "agent_configurations_agent_tenant_fk",
    columns: [t.businessId, t.agentId],
    foreignColumns: [agents.businessId, agents.id],
  }),
]).enableRLS();

export const toolDefinitions = pgTable("tool_definitions", {
  key: text("key").primaryKey(),
  description: text("description").notNull(),
});

export const agentTools = pgTable("agent_tools", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  agentId: uuid("agent_id").notNull(),
  toolKey: text("tool_key").notNull().references(() => toolDefinitions.key),
  enabled: boolean("enabled").notNull().default(false),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.agentId, t.toolKey),
  foreignKey({
    name: "agent_tools_agent_tenant_fk",
    columns: [t.businessId, t.agentId],
    foreignColumns: [agents.businessId, agents.id],
  }),
]).enableRLS();

export const channelConnections = pgTable("channel_connections", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  provider: text("provider").notNull(),
  externalAccountId: text("external_account_id").notNull(),
  credentialRef: text("credential_ref"),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.provider, t.externalAccountId),
  unique().on(t.credentialRef),
  check("channel_credential_is_reference", sql`${t.credentialRef} ~ ('^agentflow/channels/' || ${t.businessId}::text || '/' || ${t.id}::text || '$')`),
]).enableRLS();

export const agentChannels = pgTable("agent_channels", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  agentId: uuid("agent_id").notNull(),
  channelId: uuid("channel_id").notNull(),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.agentId, t.channelId),
  foreignKey({
    name: "agent_channels_agent_tenant_fk",
    columns: [t.businessId, t.agentId],
    foreignColumns: [agents.businessId, agents.id],
  }),
  foreignKey({
    name: "agent_channels_channel_tenant_fk",
    columns: [t.businessId, t.channelId],
    foreignColumns: [channelConnections.businessId, channelConnections.id],
  }),
]).enableRLS();

export const customers = pgTable("customers", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  name: text("name"),
}, (t) => [
  unique().on(t.businessId, t.id),
]).enableRLS();

export const customerIdentities = pgTable("customer_identities", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  customerId: uuid("customer_id").notNull(),
  channelId: uuid("channel_id").notNull(),
  externalCustomerId: text("external_customer_id").notNull(),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.channelId, t.externalCustomerId),
  foreignKey({
    name: "customer_identities_customer_tenant_fk",
    columns: [t.businessId, t.customerId],
    foreignColumns: [customers.businessId, customers.id],
  }),
  foreignKey({
    name: "customer_identities_channel_tenant_fk",
    columns: [t.businessId, t.channelId],
    foreignColumns: [channelConnections.businessId, channelConnections.id],
  }),
]).enableRLS();

export const conversations = pgTable("conversations", {
  agentVersion: integer("agent_version"),
  needsHuman: boolean("needs_human").notNull().default(false),
  testMode: boolean("test_mode").notNull().default(false),
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  customerId: uuid("customer_id").notNull(),
  channelId: uuid("channel_id").notNull(),
  agentId: uuid("agent_id"),
  closedAt: instant("closed_at"),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.id, t.channelId),
  foreignKey({ columns: [t.businessId, t.agentId, t.channelId], foreignColumns: [agentChannels.businessId, agentChannels.agentId, agentChannels.channelId], name: "conversation_agent_channel_fk" }),
  foreignKey({
    name: "conversations_customer_tenant_fk",
    columns: [t.businessId, t.customerId],
    foreignColumns: [customers.businessId, customers.id],
  }),
  foreignKey({
    name: "conversations_channel_tenant_fk",
    columns: [t.businessId, t.channelId],
    foreignColumns: [channelConnections.businessId, channelConnections.id],
  }),
]).enableRLS();

export const messages = pgTable("messages", {
  usage: jsonb("usage"),
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  conversationId: uuid("conversation_id").notNull(),
  channelId: uuid("channel_id").notNull(),
  externalMessageId: text("external_message_id"),
  direction: direction("direction").notNull(),
  body: text("body"),
  occurredAt: instant("occurred_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.channelId, t.externalMessageId),
  foreignKey({ columns: [t.businessId, t.conversationId, t.channelId], foreignColumns: [conversations.businessId, conversations.id, conversations.channelId], name: "message_conversation_channel_fk" }),
  index().on(t.businessId, t.conversationId, t.occurredAt),
]).enableRLS();

export const messageDeliveryEvents = pgTable("message_delivery_events", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  messageId: uuid("message_id").notNull(),
  status: deliveryStatus("status").notNull(),
  occurredAt: instant("occurred_at").notNull(),
  providerEventId: text("provider_event_id"),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.messageId, t.providerEventId),
  index().on(t.businessId, t.messageId, t.occurredAt),
  foreignKey({
    name: "message_delivery_events_message_tenant_fk",
    columns: [t.businessId, t.messageId],
    foreignColumns: [messages.businessId, messages.id],
  }),
]).enableRLS();

export const conversationAssignments = pgTable("conversation_assignments", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  conversationId: uuid("conversation_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  endedAt: instant("ended_at"),
}, (t) => [
  unique().on(t.businessId, t.id),
  uniqueIndex("one_current_conversation_assignment").on(t.businessId, t.conversationId).where(sql`${t.endedAt} IS NULL`),
  index().on(t.businessId, t.membershipId),
  foreignKey({
    name: "conversation_assignments_conversation_tenant_fk",
    columns: [t.businessId, t.conversationId],
    foreignColumns: [conversations.businessId, conversations.id],
  }),
  foreignKey({
    name: "conversation_assignments_membership_tenant_fk",
    columns: [t.businessId, t.membershipId],
    foreignColumns: [memberships.businessId, memberships.id],
  }),
]).enableRLS();

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  title: text("title").notNull(),
  sourceRef: text("source_ref").notNull(),
  status: documentStatus("status").notNull().default("pending"),
  processedAt: instant("processed_at"),
}, (t) => [
  unique().on(t.businessId, t.id),
  index().on(t.businessId, t.status),
]).enableRLS();

export const agentKnowledge = pgTable("agent_knowledge", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  agentId: uuid("agent_id").notNull(),
  documentId: uuid("document_id").notNull(),
}, (t) => [
  unique().on(t.businessId, t.id),
  unique().on(t.businessId, t.agentId, t.documentId),
  foreignKey({
    name: "agent_knowledge_agent_tenant_fk",
    columns: [t.businessId, t.agentId],
    foreignColumns: [agents.businessId, agents.id],
  }),
  foreignKey({
    name: "agent_knowledge_document_tenant_fk",
    columns: [t.businessId, t.documentId],
    foreignColumns: [knowledgeDocuments.businessId, knowledgeDocuments.id],
  }),
]).enableRLS();

export const appointments = pgTable("appointments", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  customerId: uuid("customer_id").notNull(),
  locationId: uuid("location_id").notNull(),
  status: appointmentStatus("status").notNull().default("requested"),
  startsAt: instant("starts_at").notNull(),
  endsAt: instant("ends_at").notNull(),
  timezone: text("timezone").notNull(),
}, (t) => [
  unique().on(t.businessId, t.id),
  check("appointment_time_order", sql`${t.endsAt} > ${t.startsAt}`),
  index().on(t.businessId, t.locationId, t.startsAt),
  foreignKey({
    name: "appointments_customer_tenant_fk",
    columns: [t.businessId, t.customerId],
    foreignColumns: [customers.businessId, customers.id],
  }),
  foreignKey({
    name: "appointments_location_tenant_fk",
    columns: [t.businessId, t.locationId],
    foreignColumns: [locations.businessId, locations.id],
  }),
]).enableRLS();

export const appointmentStatusEvents = pgTable("appointment_status_events", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  appointmentId: uuid("appointment_id").notNull(),
  status: appointmentStatus("status").notNull(),
  occurredAt: instant("occurred_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.businessId, t.id),
  index().on(t.businessId, t.appointmentId, t.occurredAt),
  foreignKey({
    name: "appointment_status_events_appointment_tenant_fk",
    columns: [t.businessId, t.appointmentId],
    foreignColumns: [appointments.businessId, appointments.id],
  }),
]).enableRLS();

export const auditEvents = pgTable("audit_events", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  membershipId: uuid("membership_id"),
  action: text("action").notNull(),
  targetId: uuid("target_id"),
}, (t) => [
  unique().on(t.businessId, t.id),
  index().on(t.businessId, t.createdAt),
  foreignKey({
    name: "audit_events_membership_tenant_fk",
    columns: [t.businessId, t.membershipId],
    foreignColumns: [memberships.businessId, memberships.id],
  }),
]).enableRLS();

export const workspaceInvitations = pgTable("workspace_invitations", {
  id: id(),
  businessId: businessId(),
  createdAt: createdAt(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: instant("expires_at").notNull(),
  status: text("status").notNull().default("pending"),
}, t => [
  unique().on(t.businessId, t.email),
  check("invitation_role", sql`${t.role} in ('Viewer','Assistant manager')`),
  check("invitation_status", sql`${t.status} in ('pending','accepted','declined','revoked')`),
]).enableRLS();
