import { createHmac, timingSafeEqual } from "node:crypto"
import { getEncryptionKey } from "@/lib/chat/crypto"

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0"

function requireMetaEnv(): { appId: string; appSecret: string } {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID / META_APP_SECRET are not configured")
  }
  return { appId, appSecret }
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not configured")
  return secret
}

export function getCallbackUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "")
  return `${base}/api/integrations/instagram/callback`
}

/** Signed state round-trip so the callback trusts the clientId. */
export function signState(clientId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ clientId, nonce: Date.now() }),
  ).toString("base64url")
  const sig = createHmac("sha256", getEncryptionKey(requireJwtSecret()))
    .update(payload)
    .digest("hex")
  return `${payload}.${sig}`
}

export function verifyState(state: string): string | null {
  const [payload, sig] = state.split(".")
  if (!payload || !sig) return null
  const expected = createHmac(
    "sha256",
    getEncryptionKey(requireJwtSecret()),
  )
    .update(payload)
    .digest("hex")
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { clientId?: string }
    return typeof parsed.clientId === "string" ? parsed.clientId : null
  } catch {
    return null
  }
}

export function buildDialogUrl(clientId: string): string {
  const { appId } = requireMetaEnv()
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getCallbackUrl(),
    scope: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ].join(","),
    response_type: "code",
    state: signState(clientId),
  })
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params}`
}

export function graphUrl(path: string): string {
  return `https://graph.facebook.com/${GRAPH_VERSION}${path}`
}

/** appsecret_proof for server-side Graph calls. */
export function appSecretProof(accessToken: string): string {
  const { appSecret } = requireMetaEnv()
  return createHmac("sha256", appSecret).update(accessToken).digest("hex")
}

export function getMetaAppId(): string {
  return requireMetaEnv().appId
}
