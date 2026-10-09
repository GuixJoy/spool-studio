import { describe, expect, it } from "vitest"
import { buildCaption } from "../instagram-service"

describe("buildCaption", () => {
  it("joins caption and normalized hashtags", () => {
    expect(buildCaption("New drop", "launch, #sale")).toBe(
      "New drop\n\n#launch #sale",
    )
  })
  it("rejects more than 30 hashtags", () => {
    const tags = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(" ")
    expect(() => buildCaption("hi", tags)).toThrow(/30/)
  })
  it("rejects captions over 2200 chars", () => {
    expect(() => buildCaption("x".repeat(2201), "")).toThrow(/2200/)
  })
  it("rejects empty captions", () => {
    expect(() => buildCaption("  ", "")).toThrow(/required/)
  })
})
