import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/postgres-js";

import * as authSchema from "@/db/auth-schema";
import { getConnection } from "@/db/connection";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
}

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is required");
}

const db = drizzle(getConnection(), {
  schema: authSchema,
});

export const auth = betterAuth({
  appName: "AgentFlow",
  baseURL,
  secret,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
