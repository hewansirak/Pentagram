"use server";

import ImageGenerator  from "./components/imageGenerator";
import {generateImage} from "./actions/generatedImage";

export default async function Home() {
  return (
    <ImageGenerator generateImage={generateImage} />
  );
}