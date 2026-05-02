"use client";

import { useState } from "react";
import type { GenerateResult, Post } from "@/lib/types";
import { MAX_PROMPT_LENGTH } from "@/lib/validate";

interface ImageGenerateProps {
  generateImage: (text: string) => Promise<GenerateResult>;
  posts: Post[];
  live: boolean;
}

const EXAMPLES = [
  "A neon-lit cyberpunk city skyline at night",
  "A purple sunset behind layered mountains",
  "Warm desert dunes under a pale sun",
];

function PostCard({ post }: { post: Post }) {
  return (
    <figure className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-black/[.08] bg-black/[.02] dark:border-white/[.145] dark:bg-white/[.04]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.imageUrl}
        alt={post.prompt}
        loading="lazy"
        className="h-auto w-full"
      />
      <figcaption className="p-3 text-sm">
        <p className="line-clamp-3">{post.prompt}</p>
        <p className="mt-1 text-xs opacity-60">
          {post.sample
            ? "Sample artwork"
            : new Date(post.createdAt).toLocaleString()}
        </p>
      </figcaption>
    </figure>
  );
}

export default function ImageGenerator({
  generateImage,
  posts,
  live,
}: ImageGenerateProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latest, setLatest] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setLatest(null);
    setError(null);

    try {
      const result = await generateImage(prompt);
      if (!result.success) throw new Error(result.error);
      setLatest(result.post);
      setInputText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6 sm:p-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pentagram</h1>
        <p className="mt-2 opacity-70">
          Instagram, but every picture is generated from a text prompt.
        </p>
        {!live && (
          <p
            role="note"
            className="mx-auto mt-4 max-w-xl rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
          >
            <strong>Demo mode:</strong> no GPU is connected, so prompts are
            matched to bundled sample artwork instead of being generated. See
            the README to connect the Stable Diffusion backend.
          </p>
        )}
      </header>

      <section aria-label="Generate an image">
        <form
          onSubmit={e => {
            e.preventDefault();
            submit(inputText);
          }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              maxLength={MAX_PROMPT_LENGTH}
              className="flex-1 rounded-lg border border-black/[.08] bg-black/[.05] p-3 focus:outline-none focus:ring-2 focus:ring-black dark:border-white/[.145] dark:bg-white/[.06] dark:focus:ring-white"
              placeholder="Describe the image you want to generate..."
              disabled={isLoading}
              aria-label="Image prompt"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="rounded-lg bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map(example => (
            <button
              key={example}
              type="button"
              disabled={isLoading}
              onClick={() => submit(example)}
              className="rounded-full border border-black/[.12] px-3 py-1 text-xs transition hover:bg-black/[.05] disabled:opacity-50 dark:border-white/[.2] dark:hover:bg-white/[.08]"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {isLoading && (
          <p className="mt-6 animate-pulse text-center opacity-70">
            Generating your image...
          </p>
        )}

        {latest && (
          <div className="mx-auto mt-6 max-w-md">
            <PostCard post={latest} />
          </div>
        )}
      </section>

      <section aria-label="Gallery">
        <h2 className="mb-4 text-xl font-semibold">Gallery</h2>
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
