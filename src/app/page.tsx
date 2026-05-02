import ImageGenerator from "./components/imageGenerator";
import { generateImage } from "./actions/generatedImage";
import { isLiveMode } from "@/lib/config";
import { listPosts } from "@/lib/gallery";

// The gallery changes whenever someone generates an image.
export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await listPosts();
  return (
    <ImageGenerator
      generateImage={generateImage}
      posts={posts}
      live={isLiveMode()}
    />
  );
}
