"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createPost } from "@/lib/gallery";
import { RateLimiter } from "@/lib/ratelimit";
import type { GenerateResult } from "@/lib/types";
import { validatePrompt } from "@/lib/validate";

// 5 generations per minute per IP (per server instance).
const limiter = new RateLimiter(5, 60_000);

export async function generateImage(text: string): Promise<GenerateResult> {
  const check = validatePrompt(text);
  if (!check.ok) return { success: false, error: check.error };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!limiter.check(ip || "anonymous")) {
    return {
      success: false,
      error: "You're generating too fast. Wait a minute and try again.",
    };
  }

  try {
    const post = await createPost(check.prompt);
    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.error("Image generation failed", error);
    return {
      success: false,
      error: "Image generation failed. The GPU may be warming up; try again.",
    };
  }
}
