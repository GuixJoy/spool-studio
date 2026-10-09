import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

// One row per client holding its own Instagram connection. Tokens are
// encrypted with the same AES-256-GCM scheme as user AI keys
// (src/lib/chat/crypto.ts) and never leave the server in raw form.
export const clientSocialAccounts = pgTable("client_social_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  client_id: uuid("client_id").notNull().unique(),
  provider: text("provider").notNull().default("instagram"),
  ig_user_id: text("ig_user_id"),
  page_id: text("page_id"),
  ig_username: text("ig_username"),
  encrypted_token: text("encrypted_token"),
  token_iv: text("token_iv"),
  token_tag: text("token_tag"),
  token_expires_at: timestamp("token_expires_at", { withTimezone: true }),
  connected_by: uuid("connected_by"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type ClientSocialAccount =
  typeof clientSocialAccounts.$inferSelect
export type NewClientSocialAccount =
  typeof clientSocialAccounts.$inferInsert
