import { drizzle } from "drizzle-orm/node-postgres"
import { getPool } from "@/lib/db"
import * as schema from "./schema"

// Reuse the app-wide pg pool from src/lib/db so raw queries and
// Drizzle queries share a single connection pool.
//
// Lazy proxy (not an eager client): Next's build-time page collection
// imports route modules without env, so connect on first real query
// instead of throwing at import.
let _db: DB | null = null

type DB = ReturnType<typeof drizzle<typeof schema>>

function getDb(): DB {
  if (!_db) _db = drizzle(getPool(), { schema })
  return _db
}

export const db: DB = new Proxy({} as DB, {
  get: (_target, prop) => {
    const value = (getDb() as unknown as Record<PropertyKey, unknown>)[prop]
    // oxlint-disable-next-line anti-slop/no-runtime-typeof  // preserve receiver for drizzle session methods
    return typeof value === "function" ? value.bind(getDb()) : value
  },
})

export { getPool as pool }
