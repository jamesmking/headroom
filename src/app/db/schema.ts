import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  primaryKey,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { AdapterAccountType } from "next-auth/adapters";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(`${process.env.POSTGRES_URL!}`);
export const db = drizzle(client, { casing: "snake_case" });

const timestamps = {
  created: timestamp().defaultNow().notNull(),
  updated: timestamp(),
};

export const statusEnum = pgEnum("status", ["TODO", "DOING", "DONE"]);

export const tasksTable = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  title: varchar().notNull(),
  description: varchar(),
  status: statusEnum().default("TODO").notNull(),
  ...timestamps,
});

export const createTaskSchema = createInsertSchema(tasksTable, {
  title: z.string().min(1),
});

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);
