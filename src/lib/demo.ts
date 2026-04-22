import type { Post } from "@/lib/types";

/** Bundled sample artwork, used in demo mode and as seed content for the gallery. */
export const SAMPLE_POSTS: Post[] = [
  ["sunset-mountains", "A purple sunset behind layered mountains"],
  ["moon-ocean", "A full moon reflecting on a calm night ocean"],
  ["neon-city", "A neon-lit cyberpunk city skyline at night"],
  ["forest-dawn", "Pine forest at dawn with soft golden light"],
  ["desert-dunes", "Warm desert dunes under a pale sun"],
  ["starry-night", "A deep blue starry night over rolling hills"],
].map(([slug, prompt], i) => ({
  id: `sample-${slug}`,
  prompt,
  imageUrl: `/demo/${slug}.svg`,
  createdAt: new Date(
    Date.UTC(2025, 0, 1, 12, 0, 0) - i * 3_600_000
  ).toISOString(),
  sample: true,
}));

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const KEYWORDS: Record<string, string[]> = {
  "sample-sunset-mountains": ["sunset", "mountain", "purple", "sunrise"],
  "sample-moon-ocean": ["moon", "ocean", "sea", "water", "night sea"],
  "sample-neon-city": ["neon", "city", "cyberpunk", "street", "skyline"],
  "sample-forest-dawn": ["forest", "tree", "pine", "woods", "dawn"],
  "sample-desert-dunes": ["desert", "dune", "sand", "sahara"],
  "sample-starry-night": ["star", "galaxy", "space", "sky", "hill"],
};

/** Pick the sample that best matches the prompt's words; fall back to a stable hash. */
export function pickSample(prompt: string): Post {
  const lower = prompt.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const [id, words] of Object.entries(KEYWORDS)) {
    const score = words.filter(w => lower.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  if (best) return SAMPLE_POSTS.find(p => p.id === best.id)!;
  return SAMPLE_POSTS[hash(lower) % SAMPLE_POSTS.length];
}
