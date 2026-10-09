import { describe, expect, it, vi } from "vitest"

const fetchMock = vi.fn()
vi.stubGlobal("fetch", fetchMock)
vi.stubEnv("META_APP_ID", "test-app-id")
vi.stubEnv("META_APP_SECRET", "test-app-secret")

async function loadClient() {
  vi.resetModules()
  return import("../client")
}

function okJson(body: unknown) {
  return { ok: true, json: async () => body }
}

describe("instagram graph client", () => {
  it("builds a reel container with share_to_feed", async () => {
    const { createContainer } = await loadClient()
    fetchMock.mockResolvedValueOnce(okJson({ id: "container-1" }))
    const id = await createContainer("ig-1", "tok", {
      caption: "hi #a",
      videoUrl: "https://cdn.example/v.mp4",
    })
    expect(id).toBe("container-1")
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = (init.body as URLSearchParams).toString()
    expect(body).toContain("media_type=REELS")
    expect(body).toContain("share_to_feed=true")
    expect(url).not.toContain("tok")
  })

  it("maps Meta errors to IgApiError with code", async () => {
    const { createContainer } = await loadClient()
    fetchMock.mockResolvedValueOnce(
      okJson({ error: { message: "bad param", code: 9004 } }),
    )
    await expect(
      createContainer("ig-1", "tok", {
        caption: "x",
        imageUrl: "https://cdn.example/i.jpg",
      }),
    ).rejects.toMatchObject({ name: "IgApiError", code: 9004 })
  })

  it("marks rate limits retryable, validation errors not", async () => {
    const { IgApiError } = await loadClient()
    expect(new IgApiError("rate limit hit", 80004).retryable).toBe(true)
    expect(new IgApiError("invalid aspect ratio", 9004).retryable).toBe(false)
  })

  it("reads FINISHED / ERROR container states", async () => {
    const { getContainerStatus } = await loadClient()
    fetchMock.mockResolvedValueOnce(okJson({ status_code: "FINISHED" }))
    await expect(getContainerStatus("c", "t")).resolves.toBe("FINISHED")
    fetchMock.mockResolvedValueOnce(okJson({ status_code: "ERROR" }))
    await expect(getContainerStatus("c", "t")).resolves.toBe("ERROR")
  })

  it("publishes and returns the media id", async () => {
    const { publishContainer } = await loadClient()
    fetchMock.mockResolvedValueOnce(okJson({ id: "media-9" }))
    await expect(publishContainer("ig-1", "t", "c-1")).resolves.toBe(
      "media-9",
    )
  })
})
