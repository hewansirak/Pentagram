import crypto from "node:crypto";
import { list, put } from "@vercel/blob";
import { isLiveMode } from "@/lib/config";
import { pickSample, SAMPLE_POSTS } from "@/lib/demo";
import type { Post } from "@/lib/types";

const META_PREFIX = "meta/";
const MAX_POSTS = 24;

/** Call the Modal text-to-image endpoint and return the JPEG bytes. */
async function renderWithModal(prompt: string): Promise<ArrayBuffer> {
  const url = new URL(process.env.MODAL_URL as string);
  url.searchParams.set("prompt", prompt);

  const response = await fetch(url, {
    headers: {
      "X-API-Key": process.env.API_KEY as string,
      Accept: "image/jpeg",
    },
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) {
    throw new Error(`Image service returned HTTP ${response.status}`);
  }
  return response.arrayBuffer();
}

/** Generate an image for `prompt` (live mode) or pick a sample (demo mode). */
export async function createPost(prompt: string): Promise<Post> {
  if (!isLiveMode()) return pickSample(prompt);

  const id = crypto.randomUUID();
  const image = await renderWithModal(prompt);
  const blob = await put(`images/${id}.jpg`, image, {
    access: "public",
    contentType: "image/jpeg",
  });
  const post: Post = {
    id,
    prompt,
    imageUrl: blob.url,
    createdAt: new Date().toISOString(),
  };
  await put(`${META_PREFIX}${id}.json`, JSON.stringify(post), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return post;
}

/** Newest-first gallery: stored posts in live mode, bundled samples otherwise. */
export async function listPosts(): Promise<Post[]> {
  if (!isLiveMode()) return SAMPLE_POSTS;

  try {
    const { blobs } = await list({ prefix: META_PREFIX, limit: 1000 });
    const newest = blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, MAX_POSTS);
    const posts = await Promise.all(
      newest.map(async blob => {
        const res = await fetch(blob.url, { cache: "no-store" });
        return res.ok ? ((await res.json()) as Post) : null;
      })
    );
    const stored = posts.filter((p): p is Post => p !== null);
    // Keep the page lively before anyone has generated anything.
    return stored.length > 0 ? stored : SAMPLE_POSTS;
  } catch (error) {
    console.error("Failed to load gallery", error);
    return SAMPLE_POSTS;
  }
}
