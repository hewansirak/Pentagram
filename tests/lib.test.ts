import { describe, expect, it } from "vitest";
import { isLiveMode } from "../src/lib/config";
import { pickSample, SAMPLE_POSTS } from "../src/lib/demo";
import { RateLimiter } from "../src/lib/ratelimit";
import { MAX_PROMPT_LENGTH, validatePrompt } from "../src/lib/validate";

describe("validatePrompt", () => {
  it("trims and collapses whitespace", () => {
    expect(validatePrompt("  a   red\n fox ")).toEqual({
      ok: true,
      prompt: "a red fox",
    });
  });

  it.each([
    ["", "describe"],
    ["   ", "describe"],
    ["x".repeat(MAX_PROMPT_LENGTH + 1), "too long"],
    ["a NSFW picture", "isn't allowed"],
    [42, "text"],
  ])("rejects %j", (input, message) => {
    const result = validatePrompt(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe("RateLimiter", () => {
  it("allows up to the limit within the window, then recovers", () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.check("ip", 0)).toBe(true);
    expect(limiter.check("ip", 100)).toBe(true);
    expect(limiter.check("ip", 200)).toBe(false);
    expect(limiter.check("other", 200)).toBe(true);
    expect(limiter.check("ip", 1100)).toBe(true);
  });
});

describe("pickSample", () => {
  it("matches keywords to the right artwork", () => {
    expect(pickSample("A neon city at night").id).toBe("sample-neon-city");
    expect(pickSample("sand dunes").id).toBe("sample-desert-dunes");
  });

  it("falls back to a stable choice", () => {
    expect(pickSample("zzz qqq")).toBe(pickSample("zzz qqq"));
    expect(SAMPLE_POSTS).toContain(pickSample("zzz qqq"));
  });
});

describe("isLiveMode", () => {
  it("needs the model URL, API key and blob token", () => {
    expect(isLiveMode({} as NodeJS.ProcessEnv)).toBe(false);
    expect(
      isLiveMode({
        MODAL_URL: "u",
        API_KEY: "k",
      } as unknown as NodeJS.ProcessEnv)
    ).toBe(false);
    expect(
      isLiveMode({
        MODAL_URL: "u",
        API_KEY: "k",
        BLOB_READ_WRITE_TOKEN: "t",
      } as unknown as NodeJS.ProcessEnv)
    ).toBe(true);
  });
});
