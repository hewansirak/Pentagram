import modal
import io
import os
import requests
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Response, HTTPException, Query

def download_model():
    from diffusers import AutoPipelineForText2Image
    import torch

    AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo", 
        torch_dtype=torch.float16, 
        variant="fp16"
    )

image = (modal.Image.debian_slim()
         .pip_install("fastapi", "accelerate", "transformers", "diffusers", "requests")
         .apt_install("git")
         .run_function(download_model))

app = modal.App("stability_diffusion", image=image)

@app.cls(
    image=image,
    gpu="A10G",
    secrets=[modal.Secret.from_name("API_KEY")]
)

class Model:

    @modal.build()
    @modal.enter()
    def load_weights(self):
        from diffusers import AutoPipelineForText2Image
        import torch

        self.pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
            variant="fp16"
        )

        self.pipe.to("cuda")
        self.API_KEY = os.environ.get("API_KEY")

    @modal.web_endpoint()
    def generate(self, request: Request, prompt: str = Query(..., description="The prompt for image generation")):

        api_key = request.headers.get("X-API-Key")
        if api_key != self.API_KEY:
            raise HTTPException(
                status_code=401,
                detail="Unauthorized"                 
            )

        image = self.pipe(prompt , num_inference_steps=1, guidance_scale=0.0).images[0]

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")

        return Response(content=buffer.getvalue(), media_type="image/jpeg")


