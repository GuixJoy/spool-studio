import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const uploadQueue = pgTable("upload_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  asset_id: uuid("asset_id").notNull(),
  status: text("status").notNull().default("pending"),
  priority: integer("priority").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  scheduled_date: timestamp("scheduled_date", { withTimezone: true }),
  platform: text("platform"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  recurrence: jsonb("recurrence"),
  ig_container_id: text("ig_container_id"),
  ig_media_id: text("ig_media_id"),
  attempts: integer("attempts").notNull().default(0),
  last_error: text("last_error"),
})

export type UploadQueue = typeof uploadQueue.$inferSelect
export type NewUploadQueue = typeof uploadQueue.$inferInsert
