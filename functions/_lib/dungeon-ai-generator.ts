/**
 * AI-Generated Artistic Dungeon Maps
 * 
 * Converts procedural dungeon layouts into hand-drawn style map images
 * using Cloudflare Workers AI (Stable Diffusion XL)
 */

import type { DungeonLevel } from './dungeon-generator/types';

export type DungeonType = 'dungeon' | 'cave' | 'ruin' | 'fortress' | 'tower' | 'temple' | 'lair';

interface AIGenerationOptions {
  dungeonType: DungeonType;
  width: number;
  height: number;
  seed?: number;
}

/**
 * Convert dungeon layout to detailed text description for AI prompt
 */
export function layoutToAIPrompt(level: DungeonLevel, options: AIGenerationOptions): string {
  const { dungeonType, width, height } = options;
  const { rooms, corridors, stairs } = level;
  
  const typeDescriptions: Record<DungeonType, string> = {
    dungeon: 'stone-built dungeon with worked stone walls, flagstone floors, classic D&D dungeon aesthetic',
    cave: 'natural cave system with organic, irregular walls, rough stone, natural formations',
    ruin: 'ancient ruins with crumbling walls, collapsed sections, weathered stone, overgrown areas',
    fortress: 'military fortress with thick walls, regular architecture, stone blocks, defensive features',
    tower: 'tower interior with circular/rectangular rooms, vertical structure, spiral stairs',
    temple: 'sacred temple with ornate architecture, carved stone, religious symbols',
    lair: 'monster lair with rough, natural construction, organic shapes, minimal worked stone',
  };
  
  const typeDescription = typeDescriptions[dungeonType] || typeDescriptions.dungeon;
  
  // Build room descriptions
  const roomDescriptions = rooms.map((room, idx) => {
    const roomType = room.type === 'entry' ? 'entrance' : 
                     room.type === 'exit' ? 'exit' :
                     room.type === 'stairwell' ? 'stairwell' :
                     room.type === 'special' ? 'special chamber' : 'chamber';
    
    const connections = room.connections.length > 0 
      ? `, connected to ${room.connections.length} other area${room.connections.length > 1 ? 's' : ''}`
      : '';
    
    const features = room.features.length > 0
      ? `, contains ${room.features.map(f => f.type).join(', ')}`
      : '';
    
    return `Room ${idx + 1} at grid position (${room.x},${room.y}) is ${room.width * 5}x${room.height * 5} feet, ${roomType}${connections}${features}`;
  }).join('; ');
  
  // Build corridor descriptions
  const corridorDescriptions = corridors.map((corridor, idx) => {
    if (corridor.path.length < 2) return '';
    const start = corridor.path[0];
    const end = corridor.path[corridor.path.length - 1];
    return `Corridor ${idx + 1} from (${start.x},${start.y}) to (${end.x},${end.y}), ${corridor.width * 5} feet wide`;
  }).filter(Boolean).join('; ');
  
  // Build door descriptions
  const doorDescriptions = rooms.flatMap(room => 
    room.doors.map(door => 
      `${door.type} door at (${door.x},${door.y}) in room at (${room.x},${room.y})`
    )
  ).join('; ');
  
  // Build stair descriptions
  const stairDescriptions = stairs.map(stair => 
    `Stairs at (${stair.x},${stair.y}) leading ${stair.direction} from level ${stair.from_level} to level ${stair.to_level}`
  ).join('; ');
  
  // Construct detailed prompt with specific style guidance
  const prompt = `A top-down dungeon map in hand-drawn pen-and-ink style, black lines on white paper, similar to Dyson Logos or Mike Schley D&D maps. Clean line art, no shading, no color fills, no gradients. Professional tabletop RPG map quality.

STYLE REQUIREMENTS:
- Hand-drawn pen-and-ink aesthetic, as if drawn with a fine-tip pen on graph paper
- Pure black lines (#000000) on pure white background (#FFFFFF)
- No shading, no gradients, no color fills, no textures
- Thin, consistent line weight for walls (1-2 pixels)
- Clear room boundaries with solid wall lines
- Subtle grid lines visible (light gray, barely visible)
- Clean, readable, minimalist design
- Professional D&D dungeon map style

MAP LAYOUT:
- Dungeon type: ${typeDescription}
- Grid dimensions: ${width}x${height} cells (${width * 5}x${height * 5} feet total)
- Each cell represents 5 feet
- Rooms: ${roomDescriptions}
- Corridors: ${corridorDescriptions}
${doorDescriptions ? `- Doors: ${doorDescriptions}` : ''}
${stairDescriptions ? `- Stairs: ${stairDescriptions}` : ''}

TECHNICAL SPECIFICATIONS:
- Top-down orthographic view (bird's eye view)
- All walls shown as black lines
- Floor areas are white/empty space
- Doors shown as breaks in wall lines or simple door symbols
- Stairs shown with simple directional indicators
- Grid lines are very subtle (light gray, barely visible)
- No perspective, no 3D effects, no shadows
- No decorative elements beyond functional map features

AVOID:
- 3D rendering, perspective, shadows
- Color fills, gradients, textures
- Photorealistic or digital art style
- Complex shading or lighting effects
- Decorative flourishes or artistic embellishments
- Thick or variable line weights
- Any elements that obscure the functional map layout`;

  return prompt;
}

/**
 * Generate dungeon map image using Cloudflare Workers AI
 */
export async function generateDungeonMapImage(
  level: DungeonLevel,
  options: AIGenerationOptions,
  apiToken: string,
  accountId: string
): Promise<ArrayBuffer> {
  const prompt = layoutToAIPrompt(level, options);
  const seed = options.seed ?? Math.floor(Math.random() * 1_000_000_000);
  
  // Use Stable Diffusion XL for high-quality image generation
  const model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
  
  // Calculate appropriate image size (aim for ~1 pixel per foot for readability)
  const cellSize = level.grid.cell_size || 5; // feet per cell
  const widthFeet = level.grid.width * cellSize;
  const heightFeet = level.grid.height * cellSize;
  
  // Target resolution: ~10 pixels per 5ft square for clarity
  // Clamp to reasonable bounds (512-1536)
  const targetWidth = Math.max(512, Math.min(1536, Math.ceil(widthFeet / 5 * 10)));
  const targetHeight = Math.max(512, Math.min(1536, Math.ceil(heightFeet / 5 * 10)));
  
  // Round to nearest 64 (common requirement for SD models)
  const imageWidth = Math.round(targetWidth / 64) * 64;
  const imageHeight = Math.round(targetHeight / 64) * 64;
  
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: '3D rendering, perspective, shadows, color fills, gradients, textures, photorealistic, digital art, complex shading, lighting effects, decorative elements, thick lines, variable line weights, artistic embellishments, isometric view, 3D graphics, rendered image, computer graphics',
      num_steps: 30, // More steps for better quality line art
      guidance: 9.0, // Higher guidance to enforce style constraints
      width: imageWidth,
      height: imageHeight,
      seed,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${response.status} ${errorText}`);
  }
  
  // Workers AI returns binary PNG data
  const imageData = await response.arrayBuffer();
  return imageData;
}

/**
 * Upload generated map image to Supabase Storage
 */
export async function uploadMapToStorage(
  imageData: ArrayBuffer,
  dungeonId: string,
  levelIndex: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  // Create Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const fileName = `${dungeonId}/${levelIndex}.png`;
  const bucket = 'dungeon-maps';
  
  // Convert ArrayBuffer to Blob
  const blob = new Blob([imageData], { type: 'image/png' });
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true,
    });
  
  if (error) {
    // If bucket doesn't exist, provide helpful error
    if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
      throw new Error(`Storage bucket '${bucket}' not found. Please run the setup SQL: docs/db/setup-dungeon-maps-storage.sql`);
    }
    throw new Error(`Failed to upload map: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

