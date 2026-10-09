import { NextResponse } from "next/server"
import { ApiError, jsonError } from "@/lib/api-error"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import { runDueItems } from "@/services/instagram-service"

export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) {
      throw ApiError.forbidden("Scheduler is not configured")
    }
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      throw ApiError.forbidden()
    }

    const result = await runDueItems()
    return NextResponse.json({ data: result })
  } catch (error) {
    logProductionRuntimeError("api-cron-publish-due", error)
    return jsonError(error)
  }
}
