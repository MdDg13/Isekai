import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "assets", "ai", "manifest.json");
const OUTPUT_ROOT = path.join(ROOT, "public", "generated");
const DOCS_PATH = path.join(ROOT, "docs", "TEXTURE_ASSETS.md");

const accountId = process.env.CF_ACCOUNT_ID || process.env.NEXT_PUBLIC_CF_ACCOUNT_ID;
const token = process.env.CF_WORKERS_AI_TOKEN;

if (!accountId || !token) {
  console.error("⚠️  Missing CF_ACCOUNT_ID or CF_WORKERS_AI_TOKEN environment variables.");
  process.exit(1);
}

const args = process.argv.slice(2);
const idFilter = args.find((arg) => arg.startsWith("--id="))?.split("=")[1];

async function main() {
  const manifestRaw = await fs.readFile(MANIFEST_PATH, "utf-8");
  const manifest = JSON.parse(manifestRaw);
  const assets = manifest.assets || [];

  if (!assets.length) {
    console.warn("Manifest has no assets defined.");
    return;
  }

  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  for (const asset of assets) {
    if (idFilter && asset.id !== idFilter) continue;
    try {
      await generateAsset(asset);
    } catch (error) {
      console.error(`Failed to generate ${asset.id}:`, error.message);
    }
  }
}

async function generateAsset(asset) {
  console.log(`🎨 Generating ${asset.id}...`);
  const model = asset.model || "@cf/stabilityai/stable-diffusion-xl-base-1.0";
  const body = {
    prompt: asset.prompt,
    width: asset.width || 512,
    height: asset.height || 512,
    num_steps: asset.num_steps || 25,
    guidance: asset.guidance || 7.5,
    seed: asset.seed || undefined
  };

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  const imageBase64 =
    data?.result?.image || data?.result?.[0]?.image || data?.result?.[0]?.img || data?.result;

  if (!imageBase64) {
    throw new Error("No image data returned from Workers AI");
  }

  const buffer = Buffer.from(imageBase64, "base64");
  const outDir = path.join(OUTPUT_ROOT, asset.category);
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${asset.id}.png`);
  await fs.writeFile(outPath, buffer);
  console.log(`✅ Saved ${asset.id} to ${path.relative(ROOT, outPath)}`);

  await appendDocEntry(asset, outPath);
}

async function appendDocEntry(asset, outPath) {
  const relPath = path.relative(ROOT, outPath).replace(/\\/g, "/");
  const entry = `
### ${asset.id}
- Category: ${asset.category}
- Model: ${asset.model || "@cf/stabilityai/stable-diffusion-xl-base-1.0"}
- Prompt: \`${asset.prompt}\`
- Output: \`${relPath}\`
`;
  await fs.appendFile(DOCS_PATH, entry, "utf-8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

