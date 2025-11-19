import { NextResponse } from "next/server";
import { generateWorkersAIImage } from "../../../../lib/workers-ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const buffer = await generateWorkersAIImage({
      prompt: body.prompt,
      model: body.model,
      width: body.width,
      height: body.height,
      numSteps: body.numSteps,
      guidance: body.guidance,
      seed: body.seed,
    });

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Workers AI generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

