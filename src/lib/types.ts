export type Post = {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string; // ISO timestamp
  /** true for the bundled sample artwork shown when no GPU backend is configured */
  sample?: boolean;
};

export type GenerateResult =
  | { success: true; post: Post }
  | { success: false; error: string };
