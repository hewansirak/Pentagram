import { url } from "inspector";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    // TODO: Call your Image Generation API here
    // For now, we'll just echo back the text

    console.log(text);
    const url = new URL("https://hewansg--stability-diffusion-model-generate.modal.run/");

    url.searchParams.set("prompt", text)

    console.log("Requesting URL", url.toString());

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": process.env.API_KEY || "",
        Accept: "image/jpeg"
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Received: ${text}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
