"""Stable Diffusion (SDXL-Turbo) text-to-image endpoint on Modal serverless GPUs.

Deploy:  modal deploy Modal_config/main.py
Secret:  modal secret create API_KEY API_KEY=<long random string>
"""

import hmac
import io
import os
from datetime import datetime, timezone

import modal
import requests
from fastapi import HTTPException, Query, Request, Response

# After deploying, set these to your own workspace URLs (printed by `modal deploy`).
HEALTH_URL = os.environ.get("MODAL_HEALTH_URL", "")
GENERATE_URL = os.environ.get("MODAL_URL", "")

# Keeping the container warm avoids multi-second cold starts but means a GPU is billed
# around the clock. Set KEEP_WARM=1 at deploy time only if you need the latency.
KEEP_WARM = os.environ.get("KEEP_WARM") == "1"


def download_model():
    import torch
    from diffusers import AutoPipelineForText2Image

    AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16",
    )


image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "accelerate", "transformers", "diffusers", "requests")
    .apt_install("git")
    .run_function(download_model)
)

app = modal.App("stability_diffusion", image=image)


@app.cls(
    image=image,
    gpu="A10G",
    container_idle_timeout=300,
    secrets=[modal.Secret.from_name("API_KEY")],
)
class Model:
    @modal.build()
    @modal.enter()
    def load_weights(self):
        import torch
        from diffusers import AutoPipelineForText2Image

        self.pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
            variant="fp16",
        )
        self.pipe.to("cuda")
        self.API_KEY = os.environ.get("API_KEY", "")

    @modal.web_endpoint()
    def generate(
        self,
        request: Request,
        prompt: str = Query(..., min_length=1, max_length=300, description="Text prompt"),
    ):
        supplied = request.headers.get("X-API-Key", "")
        # Constant-time comparison; also reject when no key is configured.
        if not self.API_KEY or not hmac.compare_digest(supplied, self.API_KEY):
            raise HTTPException(status_code=401, detail="Unauthorized")

        result = self.pipe(prompt, num_inference_steps=1, guidance_scale=0.0).images[0]

        buffer = io.BytesIO()
        result.save(buffer, format="JPEG")
        return Response(content=buffer.getvalue(), media_type="image/jpeg")

    @modal.web_endpoint()
    def health(self):
        """Lightweight endpoint for keeping the container warm."""
        return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


if KEEP_WARM:

    @app.function(
        schedule=modal.Cron("*/5 * * * *"),
        secrets=[modal.Secret.from_name("API_KEY")],
    )
    def keep_warm():
        """Ping the endpoints every 5 minutes so a GPU container stays loaded."""
        health = requests.get(HEALTH_URL, timeout=60)
        health.raise_for_status()
        print(f"Health check at: {health.json()['timestamp']}")

        headers = {"X-API-Key": os.environ["API_KEY"]}
        generated = requests.get(
            GENERATE_URL, params={"prompt": "warm-up"}, headers=headers, timeout=120
        )
        generated.raise_for_status()
        print(f"Generate endpoint OK at: {datetime.now(timezone.utc).isoformat()}")
