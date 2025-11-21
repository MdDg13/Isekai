interface GenerateOptions {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  numSteps?: number;
  guidance?: number;
  seed?: number;
}

export async function generateWorkersAIImage(options: GenerateOptions) {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID ||
    process.env.NEXT_PUBLIC_CF_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_WORKERS_AI_TOKEN;

  if (!accountId || !token) {
    throw new Error(
      "Cloudflare Workers AI credentials are not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN."
    );
  }

  const model = options.model || "@cf/stabilityai/stable-diffusion-xl-base-1.0";
  const payload = {
    prompt: options.prompt,
    width: options.width ?? 512,
    height: options.height ?? 512,
    num_steps: Math.min(options.numSteps ?? 20, 20), // Max 20 for Workers AI
    guidance: options.guidance ?? 7.5,
    seed: options.seed ?? undefined,
  };

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  // Check content type - Workers AI can return binary PNG or JSON
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    // JSON response with base64 image
    const data = await response.json();
    const imageBase64 =
      data?.result?.image || data?.result?.[0]?.image || data?.result?.[0]?.img || data?.result;

    if (!imageBase64) {
      throw new Error("Workers AI response contained no image data.");
    }

    return Buffer.from(imageBase64, "base64");
  } else {
    // Binary PNG response
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

