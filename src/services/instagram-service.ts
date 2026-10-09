import {
  decryptApiKey,
  encryptApiKey,
} from "@/lib/chat/crypto"
import { getCurrentUser } from "@/lib/auth"
import { emitEvent } from "@/lib/event-bus"
import { getPresignedDownloadUrl } from "@/integrations/r2/r2-service"
import {
  IgApiError,
  createContainer,
  getContainerStatus,
  publishContainer,
  refreshLongLivedToken,
} from "@/integrations/instagram/client"
import {
  getAssetById,
  publishAssetWithRecord,
} from "@/repositories/assets-repository"
import {
  deleteSocialAccountByClientId,
  getSocialAccountByClientId,
  upsertSocialAccount,
} from "@/repositories/client-social-accounts-repository"
import {
  getUploadQueueItemById,
  listUploadQueue,
  updateUploadQueueItem,
} from "@/repositories/upload-queue-repository"
import { logAssetActivity } from "@/services/activity-service"
import { logAuditEvent } from "@/services/audit-log-service"
import { getOrCreateCurrentUserProfile } from "@/services/users-service"

export interface SocialConnectionStatus {
  connected: boolean
  igUsername?: string
  igUserId?: string
  tokenExpiresAt?: Date | null
  needsReconnect: boolean
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not configured")
  return secret
}

export async function getConnectionStatus(
  clientId: string,
): Promise<SocialConnectionStatus> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  const row = await getSocialAccountByClientId(clientId)
  if (!row?.encrypted_token) {
    return { connected: false, needsReconnect: false }
  }
  return {
    connected: true,
    igUsername: row.ig_username ?? undefined,
    igUserId: row.ig_user_id ?? undefined,
    tokenExpiresAt: row.token_expires_at,
    needsReconnect: false,
  }
}

export async function saveConnection(input: {
  clientId: string
  igUserId: string
  pageId?: string
  igUsername?: string
  accessToken: string
  expiresInDays: number
}): Promise<SocialConnectionStatus> {
  const user = await getOrCreateCurrentUserProfile()
  const blob = encryptApiKey(input.accessToken, requireJwtSecret())
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)
  await upsertSocialAccount({
    client_id: input.clientId,
    provider: "instagram",
    ig_user_id: input.igUserId,
    page_id: input.pageId ?? null,
    ig_username: input.igUsername ?? null,
    encrypted_token: blob.ciphertext,
    token_iv: blob.iv,
    token_tag: blob.tag,
    token_expires_at: expiresAt,
    connected_by: user.id,
  })
  return getConnectionStatus(input.clientId)
}

export async function removeConnection(clientId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Forbidden")
  await deleteSocialAccountByClientId(clientId)
}

/** Server-only: raw token for Graph calls. Never return this to clients. */
export async function getDecryptedToken(
  clientId: string,
): Promise<{ igUserId: string; token: string } | null> {  const row = await getSocialAccountByClientId(clientId)
  if (
    !row?.encrypted_token ||
    !row.token_iv ||
    !row.token_tag ||
    !row.ig_user_id
  ) {
    return null
  }
  try {
    const token = decryptApiKey(
      {
        ciphertext: row.encrypted_token,
        iv: row.token_iv,
        tag: row.token_tag,
      },
      requireJwtSecret(),
    )
    return { igUserId: row.ig_user_id, token }
  } catch {
    return null
  }
}

const MAX_CAPTION_CHARS = 2200
const MAX_HASHTAGS = 30
const POLL_INTERVAL_MS = 5000
const POLL_BUDGET_MS = 45000
const REFRESH_BEFORE_DAYS = 7

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function buildCaption(caption: string, hashtags: string): string {
  const tags = hashtags
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
  if (tags.length > MAX_HASHTAGS) {
    throw new Error(`At most ${MAX_HASHTAGS} hashtags allowed`)
  }
  const full = tags.length > 0 ? `${caption.trim()}\n\n${tags.join(" ")}` : caption.trim()
  if (full.length > MAX_CAPTION_CHARS) {
    throw new Error(`Caption exceeds ${MAX_CAPTION_CHARS} characters`)
  }
  if (!full) throw new Error("Caption is required")
  return full
}

async function tokenForClient(clientId: string): Promise<{
  igUserId: string
  token: string
  connectedBy: string | null
}> {
  const row = await getSocialAccountByClientId(clientId)
  if (!row?.ig_user_id) throw new Error("Instagram is not connected for this client")
  const creds = await getDecryptedToken(clientId)
  if (!creds) throw new Error("Instagram connection is broken — reconnect it")
  let token = creds.token
  // Refresh-on-use: no daemon needed.
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at) : null
  const daysLeft = expiresAt
    ? (expiresAt.getTime() - Date.now()) / 86400000
    : Infinity
  if (daysLeft < REFRESH_BEFORE_DAYS) {
    try {
      const refreshed = await refreshLongLivedToken(token)
      const blob = encryptApiKey(refreshed.accessToken, requireJwtSecret())
      const next = new Date()
      next.setDate(next.getDate() + refreshed.expiresInDays)
      await upsertSocialAccount({
        client_id: clientId,
        provider: "instagram",
        ig_user_id: row.ig_user_id,
        page_id: row.page_id,
        ig_username: row.ig_username,
        encrypted_token: blob.ciphertext,
        token_iv: blob.iv,
        token_tag: blob.tag,
        token_expires_at: next,
        connected_by: row.connected_by,
      })
      token = refreshed.accessToken
    } catch (error) {
      console.error("[ig][token-refresh-failed]", {
        clientId,
        message: error instanceof Error ? error.message : "unknown",
      })
      // Fall through with the old token; Meta will reject if truly dead.
    }
  }
  return { igUserId: creds.igUserId, token, connectedBy: row.connected_by }
}

/**
 * System publish: record publication + timeline without a user session
 * (cron has none). Auth is enforced by callers, never weakened here.
 */
async function systemMarkPublished(
  assetId: string,
  actorId: string | null,
  fromStatus: string,
): Promise<void> {
  const publishedAt = new Date()
  await publishAssetWithRecord(
    assetId,
    { status: "published", published_at: publishedAt },
    publishedAt.toISOString(),
  )
  emitEvent({
    type: "asset:status-changed",
    userId: actorId ?? undefined,
    payload: { assetId, previousStatus: fromStatus, nextStatus: "published" },
  })
  try {
    await logAssetActivity({
      assetId,
      action: "status_changed",
      metadata: { from: fromStatus, to: "published", via: "instagram" },
    })
  } catch {
    // Activity logging should not block publishing.
  }
  try {
    await logAuditEvent({
      userId: actorId,
      action: "instagram_published",
      entityType: "asset",
      entityId: assetId,
      metadata: { via: "instagram" },
    })
  } catch {
    // Audit logging should not block publishing.
  }
}

async function failItem(
  queueId: string,
  attempts: number,
  message: string,
): Promise<never> {
  await updateUploadQueueItem(queueId, {
    status: "failed",
    attempts: attempts + 1,
    last_error: message.slice(0, 500),
  })
  throw new Error(message)
}

export async function publishQueueItem(queueId: string): Promise<{
  igMediaId: string
}> {
  const item = await getUploadQueueItemById(queueId)
  if (!item) throw new Error("Queue item not found")
  if (item.status === "published") return { igMediaId: item.ig_media_id ?? "" }

  const asset = await getAssetById(item.asset_id)
  if (!asset) {
    await failItem(queueId, item.attempts ?? 0, "Asset no longer exists")
    throw new Error("Asset no longer exists")
  }
  if (!asset.drive_file_id) {
    await failItem(queueId, item.attempts ?? 0, "Asset has no uploaded file yet")
    throw new Error("Asset has no uploaded file yet")
  }

  let creds: { igUserId: string; token: string; connectedBy: string | null }
  try {
    creds = await tokenForClient(asset.client_id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not connected"
    await failItem(queueId, item.attempts ?? 0, message)
    throw error instanceof Error ? error : new Error(message)
  }
  const { igUserId, token, connectedBy } = creds

  await updateUploadQueueItem(queueId, {
    status: "publishing",
    attempts: (item.attempts ?? 0) + 1,
    last_error: null,
  })

  const caption = buildCaption(item.caption ?? "", item.hashtags ?? "")
  // Meta pulls this itself — server bytes never proxy through us.
  const mediaUrl = await getPresignedDownloadUrl(asset.drive_file_id, 7200)
  const isVideo = (asset.mime_type ?? "").startsWith("video/")

  let containerId = item.ig_container_id
  try {
    if (!containerId) {
      containerId = await createContainer(igUserId, token, {
        caption,
        ...(isVideo ? { videoUrl: mediaUrl } : { imageUrl: mediaUrl }),
      })
      await updateUploadQueueItem(queueId, { ig_container_id: containerId })
    }

    if (isVideo) {
      const started = Date.now()
      for (;;) {
        const state = await getContainerStatus(containerId, token)
        if (state === "FINISHED") break
        if (state === "ERROR" || state === "EXPIRED") {
          await updateUploadQueueItem(queueId, { ig_container_id: null })
          await failItem(
            queueId,
            item.attempts ?? 0,
            `Instagram failed to process the video (${state})`,
          )
        }
        if (Date.now() - started > POLL_BUDGET_MS) {
          // Container id persists — next run resumes instead of re-uploading.
          await updateUploadQueueItem(queueId, { status: "pending" })
          throw new Error("Video still processing — will resume on next run")
        }
        await sleep(POLL_INTERVAL_MS)
      }
    }

    const igMediaId = await publishContainer(igUserId, token, containerId)
    await systemMarkPublished(item.asset_id, connectedBy, asset.status)
    await updateUploadQueueItem(queueId, {
      status: "published",
      ig_media_id: igMediaId,
      last_error: null,
    })
    return { igMediaId }
  } catch (error) {
    if (error instanceof IgApiError && !error.retryable) {
      await failItem(
        queueId,
        item.attempts ?? 0,
        error.message.replace(/^Instagram rejected .*?: /, "Instagram: "),
      )
    }
    if (error instanceof Error && error.message.includes("will resume")) {
      throw error
    }
    const message = error instanceof Error ? error.message : "Publish failed"
    await updateUploadQueueItem(queueId, {
      status: "failed",
      last_error: message.slice(0, 500),
    })
    throw error instanceof Error ? error : new Error(message)
  }
}

export async function runDueItems(now = new Date()): Promise<{
  processed: number
  published: number
  failed: number
}> {
  const rows = await listUploadQueue()
  const due = rows.filter(
    (r) =>
      r.platform === "instagram" &&
      (r.status === "pending" || r.status === "scheduled") &&
      (!r.scheduled_date || new Date(r.scheduled_date) <= now),
  )
  let published = 0
  let failed = 0
  for (const row of due) {
    try {
      await publishQueueItem(row.id)
      published += 1
    } catch (error) {
      // publishQueueItem already recorded the failure on the row.
      console.error("[ig][due-item-failed]", {
        queueId: row.id,
        message: error instanceof Error ? error.message : "unknown",
      })
      failed += 1
    }
  }
  return { processed: due.length, published, failed }
}
