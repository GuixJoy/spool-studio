import {
  appSecretProof,
  getMetaAppId,
  graphUrl,
} from "@/lib/instagram-oauth"

export class IgApiError extends Error {
  code?: number
  retryable: boolean

  constructor(message: string, code?: number) {
    super(message)
    this.name = "IgApiError"
    this.code = code
    // Rate limits and transient Meta failures are worth one retry.
    this.retryable =
      code === 80004 ||
      code === 80005 ||
      /rate|temporar|try again|timeout/i.test(message)
  }
}

interface GraphErrorBody {
  error?: { message?: string; code?: number; error_subcode?: number }
}

async function graphFetch<T>(
  path: string,
  init: RequestInit,
  context: string,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(graphUrl(path), init)
  } catch (error) {
    throw new IgApiError(
      `Instagram unreachable during ${context}: ${error instanceof Error ? error.message : "network error"}`,
    )
  }
  const body = (await res.json().catch(() => ({}))) as GraphErrorBody & T
  if (!res.ok || body.error) {
    const code = body.error?.code
    const message = body.error?.message ?? `HTTP ${res.status}`
    console.error("[ig][api-error]", { context, code, message })
    throw new IgApiError(`Instagram rejected ${context}: ${message}`, code)
  }
  return body
}

function form(params: Record<string, string>): URLSearchParams {
  return new URLSearchParams(params)
}

export interface ContainerInput {
  caption: string
  imageUrl?: string
  videoUrl?: string
  coverUrl?: string
}

export async function createContainer(
  igUserId: string,
  token: string,
  input: ContainerInput,
): Promise<string> {
  const isReel = Boolean(input.videoUrl)
  const body = await graphFetch<{ id: string }>(
    `/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({
        ...(isReel
          ? {
              media_type: "REELS",
              video_url: input.videoUrl as string,
              share_to_feed: "true",
              ...(input.coverUrl ? { cover_url: input.coverUrl } : {}),
            }
          : { image_url: input.imageUrl as string }),
        caption: input.caption,
        access_token: token,
        appsecret_proof: appSecretProof(token),
      }),
    },
    isReel ? "reel container" : "photo container",
  )
  if (!body.id) throw new IgApiError("Instagram returned no container id")
  return body.id
}

export type ContainerStatus =
  | "IN_PROGRESS"
  | "FINISHED"
  | "ERROR"
  | "EXPIRED"
  | "UNKNOWN"

export async function getContainerStatus(
  containerId: string,
  token: string,
): Promise<ContainerStatus> {
  const params = new URLSearchParams({
    fields: "status_code",
    access_token: token,
    appsecret_proof: appSecretProof(token),
  })
  const body = await graphFetch<{ status_code?: string }>(
    `/${containerId}?${params}`,
    { method: "GET" },
    "container status",
  )
  const code = body.status_code ?? ""
  if (code === "FINISHED") return "FINISHED"
  if (code === "ERROR") return "ERROR"
  if (code === "EXPIRED") return "EXPIRED"
  if (code === "IN_PROGRESS" || code === "PUBLISHED") return "IN_PROGRESS"
  console.warn("[ig][container-unknown-status]", { containerId, code })
  return "UNKNOWN"
}

export async function publishContainer(
  igUserId: string,
  token: string,
  containerId: string,
): Promise<string> {
  const body = await graphFetch<{ id: string }>(
    `/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form({
        creation_id: containerId,
        access_token: token,
        appsecret_proof: appSecretProof(token),
      }),
    },
    "media publish",
  )
  if (!body.id) throw new IgApiError("Instagram returned no media id")
  return body.id
}

export async function refreshLongLivedToken(
  token: string,
): Promise<{ accessToken: string; expiresInDays: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: getMetaAppId(),
    client_secret: process.env.META_APP_SECRET ?? "",
    fb_exchange_token: token,
  })
  const body = await graphFetch<{ access_token: string; expires_in?: number }>(
    `/oauth/access_token?${params}`,
    { method: "GET" },
    "token refresh",
  )
  if (!body.access_token) throw new IgApiError("Token refresh came back empty")
  return {
    accessToken: body.access_token,
    expiresInDays: Math.max(
      1,
      Math.floor((body.expires_in ?? 60 * 24 * 3600) / 86400),
    ),
  }
}

export async function getTokenDebugExpiry(
  token: string,
): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      input_token: token,
      access_token: `${getMetaAppId()}|${process.env.META_APP_SECRET ?? ""}`,
    })
    const body = await graphFetch<{ data?: { expires_at?: number } }>(
      `/debug_token?${params}`,
      { method: "GET" },
      "token debug",
    )
    return body.data?.expires_at ?? null
  } catch {
    return null
  }
}
