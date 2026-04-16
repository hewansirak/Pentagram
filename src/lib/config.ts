/**
 * The app runs in one of two modes:
 *  - live: prompts go to the Modal GPU endpoint and images are stored in Vercel Blob.
 *  - demo: no external services needed; prompts are matched to bundled sample artwork.
 */
export function isLiveMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.MODAL_URL && env.API_KEY && env.BLOB_READ_WRITE_TOKEN);
}
