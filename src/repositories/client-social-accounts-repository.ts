import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
  type ClientSocialAccount,
  type NewClientSocialAccount,
  clientSocialAccounts,
} from "@/db/schema"

export type DbClientSocialAccount = ClientSocialAccount
export type DbNewClientSocialAccount = NewClientSocialAccount

export async function getSocialAccountByClientId(
  clientId: string,
): Promise<DbClientSocialAccount | null> {
  const rows = await db
    .select()
    .from(clientSocialAccounts)
    .where(eq(clientSocialAccounts.client_id, clientId))
    .limit(1)
  return rows[0] ?? null
}

export async function upsertSocialAccount(
  payload: DbNewClientSocialAccount,
): Promise<DbClientSocialAccount> {
  const rows = await db
    .insert(clientSocialAccounts)
    .values(payload)
    .onConflictDoUpdate({
      target: clientSocialAccounts.client_id,
      set: {
        provider: payload.provider,
        ig_user_id: payload.ig_user_id ?? null,
        page_id: payload.page_id ?? null,
        ig_username: payload.ig_username ?? null,
        encrypted_token: payload.encrypted_token ?? null,
        token_iv: payload.token_iv ?? null,
        token_tag: payload.token_tag ?? null,
        token_expires_at: payload.token_expires_at ?? null,
        connected_by: payload.connected_by ?? null,
        updated_at: new Date(),
      },
    })
    .returning()
  return rows[0]
}

export async function deleteSocialAccountByClientId(
  clientId: string,
): Promise<void> {
  await db
    .delete(clientSocialAccounts)
    .where(eq(clientSocialAccounts.client_id, clientId))
}
