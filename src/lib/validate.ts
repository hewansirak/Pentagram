export const MAX_PROMPT_LENGTH = 300;

// A deliberately small blocklist: it catches obvious abuse, it is not a safety system.
const BLOCKED_TERMS = [
  "nude",
  "naked",
  "nsfw",
  "porn",
  "gore",
  "beheading",
  "child abuse",
  "self-harm",
  "suicide",
];

export type PromptCheck =
  | { ok: true; prompt: string }
  | { ok: false; error: string };

export function validatePrompt(input: unknown): PromptCheck {
  if (typeof input !== "string") {
    return { ok: false, error: "Prompt must be text." };
  }
  const prompt = input.replace(/\s+/g, " ").trim();
  if (!prompt) return { ok: false, error: "Please describe an image." };
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters).`,
    };
  }
  const lower = prompt.toLowerCase();
  if (BLOCKED_TERMS.some(term => lower.includes(term))) {
    return { ok: false, error: "That prompt isn't allowed." };
  }
  return { ok: true, prompt };
}
