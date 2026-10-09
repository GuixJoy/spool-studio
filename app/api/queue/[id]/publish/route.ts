import { NextResponse } from "next/server"
import { z } from "zod"
import { ApiError, jsonError, readJsonBody } from "@/lib/api-error"
import { parseBody } from "@/lib/api-validation"
import { requirePermission } from "@/lib/auth"
import { logProductionRuntimeError } from "@/lib/runtime-diagnostics"
import {
  buildCaption,
  publishQueueItem,
} from "@/services/instagram-service"
import {
  getUploadQueueItemById,
  updateUploadQueueItem,
} from "@/repositories/upload-queue-repository"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requirePermission("assets:approve")

    const params = await context.params
    const queueId = params?.id
    if (!queueId) {
      throw ApiError.badRequest("Queue id is required")
    }

    const body = await readJsonBody(request)
    const parsed = parseBody(
      z.object({
        caption: z.string().max(2200).optional(),
        hashtags: z.string().max(500).optional(),
      }),
      body,
    )
    if (!parsed.ok) {
      return parsed.response
    }

    // Validate + persist the composed caption before spending Meta calls.
    if (parsed.data.caption !== undefined || parsed.data.hashtags !== undefined) {
      const current = await getUploadQueueItemById(queueId)
      buildCaption(
        parsed.data.caption ?? current?.caption ?? "",
        parsed.data.hashtags ?? current?.hashtags ?? "",
      )
      await updateUploadQueueItem(queueId, {
        ...(parsed.data.caption !== undefined
          ? { caption: parsed.data.caption }
          : {}),
        ...(parsed.data.hashtags !== undefined
          ? { hashtags: parsed.data.hashtags }
          : {}),
      })
    }

    const result = await publishQueueItem(queueId)
    return NextResponse.json({ data: result })
  } catch (error) {
    logProductionRuntimeError("api-queue-publish", error)
    return jsonError(error)
  }
}
