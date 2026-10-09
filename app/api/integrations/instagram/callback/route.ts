import { NextResponse } from "next/server"
import { ApiError, jsonError } from "@/lib/api-error"
import { requireUser } from "@/lib/auth"
import { rateLimit } from "@/src/lib/rate-limit"
import { rateLimits } from "@/src/lib/rate-limit-config"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import {
  appSecretProof,
  getCallbackUrl,
  getMetaAppId,
  graphUrl,
  verifyState,
} from "@/lib/instagram-oauth"
import { saveConnection } from "@/services/instagram-service"

function clientBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "")
}

function clientUrl(clientId: string, flag: string): string {
  return `${clientBase()}/dashboard/clients/${clientId}?ig=${flag}`
}

async function graphGet<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const body = (await res.json()) as {
    error?: { message?: string; code?: number }
  } & T
  if (!res.ok || body.error) {
    throw new Error(
      `Meta error${body.error?.code ? ` ${body.error.code}` : ""}: ${body.error?.message ?? res.statusText}`,
    )
  }
  return body
}

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const limit = rateLimit(
      `instagram-callback:${user.id}`,
      rateLimits.portalTokenPost(),
    )
    if (!limit.ok) {
      throw ApiError.tooManyRequests(limit.retryAfterSeconds)
    }

    const { searchParams } = new URL(request.url)
    const fbError = searchParams.get("error_description") ?? searchParams.get("error")
    const code = searchParams.get("code")
    const clientId = verifyState(searchParams.get("state") ?? "")
    if (fbError || !code || !clientId) {
      throw ApiError.badRequest(fbError ?? "Invalid OAuth response")
    }

    const appId = getMetaAppId()
    const appSecret = process.env.META_APP_SECRET ?? ""

    // Code -> short-lived user token.
    const shortParams = new URLSearchParams({
      client_id: appId,
      redirect_uri: getCallbackUrl(),
      client_secret: appSecret,
      code,
    })
    const short = await graphGet<{ access_token: string }>(
      `${graphUrl("/oauth/access_token")}?${shortParams}`,
    )

    // Short -> long-lived (~60 days).
    const longParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: short.access_token,
    })
    const long = await graphGet<{ access_token: string; expires_in?: number }>(
      `${graphUrl("/oauth/access_token")}?${longParams}`,
    )

    // Discover the Instagram Business/Creator account.
    const accountsParams = new URLSearchParams({
      fields: "instagram_business_account{id,username}",
      access_token: long.access_token,
      appsecret_proof: appSecretProof(long.access_token),
    })
    const accounts = await graphGet<{
      data: Array<{
        instagram_business_account?: { id: string; username: string }
      }>
    }>(`${graphUrl("/me/accounts")}?${accountsParams}`)
    const ig = accounts.data
      .map((a) => a.instagram_business_account)
      .find((b): b is { id: string; username: string } => Boolean(b?.id))
    if (!ig) {
      throw ApiError.badRequest(
        "No Instagram Business/Creator account linked to this Facebook login",
      )
    }

    await saveConnection({
      clientId,
      igUserId: ig.id,
      igUsername: ig.username,
      accessToken: long.access_token,
      expiresInDays: Math.max(
        1,
        Math.floor((long.expires_in ?? 60 * 24 * 3600) / 86400),
      ),
    })

    return NextResponse.redirect(clientUrl(clientId, "connected"))
  } catch (error) {
    logProductionRuntimeError("api-instagram-callback", error)
    // Browser flow: always redirect back, never strand on JSON. Preserve a
    // safe reason code so the UI can explain common failures.
    const clientId = (() => {
      try {
        return verifyState(
          new URL(request.url).searchParams.get("state") ?? "",
        )
      } catch {
        return null
      }
    })()
    const reason =
      error instanceof ApiError && error.status === 429
        ? "rate_limited"
        : "error"
    if (!clientId) {
      return jsonError(error)
    }
    return NextResponse.redirect(clientUrl(clientId, reason))
  }
}
