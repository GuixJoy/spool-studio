import { NextResponse } from "next/server"
import { z } from "zod"
import { ApiError, jsonError } from "@/lib/api-error"
import { requirePermission } from "@/lib/auth"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import { buildDialogUrl } from "@/lib/instagram-oauth"

export async function GET(request: Request) {
  try {
    await requirePermission("portal:manage")

    const { searchParams } = new URL(request.url)
    const parsed = z
      .object({ clientId: z.string().uuid("clientId must be a valid id") })
      .safeParse({ clientId: searchParams.get("clientId") })
    if (!parsed.success) {
      throw ApiError.badRequest("clientId must be a valid id")
    }

    return NextResponse.redirect(buildDialogUrl(parsed.data.clientId))
  } catch (error) {
    logProductionRuntimeError("api-instagram-auth", error)
    return jsonError(error)
  }
}
