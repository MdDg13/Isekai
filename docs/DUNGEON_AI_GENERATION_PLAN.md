# AI-Generated Artistic Dungeon Maps - Design Plan

## Overview

Complete redesign of dungeon map generation to produce clear, artistic, hand-drawn style maps similar to:
- [Sly Flourish's ideal dungeon maps](https://slyflourish.com/your_only_dungeon_map.html) - Hand-drawn style with clear lines
- [Rand Roll's dungeon generators](https://www.randroll.com/dungeon-map-generators-guide/) - Clean, readable, artistic maps

## Current State Analysis

**Problems with Current Approach:**
- Texture overlays create cluttered, unreadable maps
- Procedural generation + texture blending doesn't produce artistic results
- Maps lack the clarity and style of professional D&D maps
- Too much detail obscures gameplay information

**What We Need:**
- Clean, artistic hand-drawn style maps
- Clear distinction between walls, floors, doors, features
- Readable at tabletop scale (printable)
- Consistent artistic style
- Fast generation

## New Approach: AI-Generated Complete Maps

### Strategy

Instead of:
1. Procedural generation → 2. Texture application → 3. Rendering

We'll do:
1. Procedural generation (layout data) → 2. AI generates complete artistic map image → 3. Display image

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ 1. Procedural Generation (BSP + MST)                     │
│    - Generates dungeon layout data (rooms, corridors)   │
│    - Creates JSON structure with coordinates             │
│    - Output: DungeonLayout data structure                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Layout to Prompt Conversion                          │
│    - Converts layout data to descriptive text           │
│    - Creates detailed prompt for AI image generation    │
│    - Includes: room sizes, connections, features        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. AI Image Generation (Cloudflare Workers AI)         │
│    - Uses Stable Diffusion XL                           │
│    - Generates complete map image in hand-drawn style   │
│    - Output: PNG image (1024x1024 or larger)            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Storage & Display                                    │
│    - Save to Supabase Storage                           │
│    - Display in React component                         │
│    - Support zoom/pan for large maps                    │
└─────────────────────────────────────────────────────────┘
```

## AI Prompt Strategy

### Base Prompt Template

```
Create a top-down dungeon map in hand-drawn black and white style, similar to classic D&D maps by Dyson Logos or Mike Schley. 

Map specifications:
- Style: Clean black lines on white background, hand-drawn aesthetic
- Scale: 5-foot squares clearly visible
- Rooms: [ROOM_DESCRIPTIONS]
- Corridors: [CORRIDOR_DESCRIPTIONS]
- Features: [FEATURE_DESCRIPTIONS]
- Grid: Subtle grid lines for 5ft squares
- No color fills, only line art
- Clear, readable, artistic style
```

### Prompt Components

**Room Descriptions:**
- Convert each room to: "Room at (x,y) is [width]x[height] feet, [type], connected to [connections]"
- Example: "Room at (10,5) is 20x30 feet, chamber, connected to corridor north and east"

**Corridor Descriptions:**
- Convert corridors to: "Corridor from (x1,y1) to (x2,y2), [width] feet wide"
- Example: "Corridor from (10,5) to (15,5), 5 feet wide, connects to room at (15,5)"

**Feature Descriptions:**
- Doors: "Wooden door at (x,y) between [room1] and [room2]"
- Stairs: "Stairs at (x,y) leading [up/down]"
- Special: "Altar at (x,y) in [room]"

### Dungeon Type Variations

**Dungeon:**
- "Stone-built dungeon with worked stone walls, flagstone floors"
- "Classic D&D dungeon aesthetic"

**Cave:**
- "Natural cave system with organic, irregular walls"
- "Rough stone, natural formations"

**Ruin:**
- "Ancient ruins with crumbling walls, collapsed sections"
- "Weathered stone, overgrown areas"

**Fortress:**
- "Military fortress with thick walls, regular architecture"
- "Stone blocks, defensive features"

**Tower:**
- "Tower interior with circular/rectangular rooms"
- "Vertical structure, spiral stairs"

**Temple:**
- "Sacred temple with ornate architecture"
- "Carved stone, religious symbols"

**Lair:**
- "Monster lair with rough, natural construction"
- "Organic shapes, minimal worked stone"

## Implementation Plan

### Phase 1: Core AI Generation

1. **Create AI Map Generator Function**
   - Location: `functions/_lib/dungeon-ai-generator.ts`
   - Input: `DungeonLayout` data structure
   - Output: Image URL (Supabase Storage)

2. **Layout to Prompt Converter**
   - Function: `layoutToAIPrompt(layout: DungeonLayout, type: DungeonType): string`
   - Converts procedural layout to detailed text description
   - Includes all rooms, corridors, doors, features

3. **AI Image Generation**
   - Use Cloudflare Workers AI: `@cf/stabilityai/stable-diffusion-xl-base-1.0`
   - Generate 1024x1024 or 1536x1536 images
   - Store in Supabase Storage: `dungeon-maps/` bucket

### Phase 2: Integration

1. **Update Dungeon Generation API**
   - Modify `functions/api/generate-dungeon.ts`
   - After procedural generation, call AI generator
   - Store map image URL in dungeon record

2. **Update Database Schema**
   - Add `map_image_url` field to dungeon records
   - Store full-resolution AI-generated map

3. **Update React Components**
   - `DungeonMapView.tsx` - Display AI-generated image
   - Fallback to procedural SVG if image not available
   - Support zoom/pan for large maps

### Phase 3: Optimization

1. **Caching Strategy**
   - Cache generated maps by layout hash
   - Reuse maps for identical layouts

2. **Progressive Enhancement**
   - Show procedural SVG immediately
   - Replace with AI image when ready
   - Loading states and progress indicators

3. **Quality Improvements**
   - Fine-tune prompts based on results
   - A/B test different prompt styles
   - Collect user feedback on map quality

## Technical Details

### Image Specifications

- **Resolution**: 1024x1024 minimum, 1536x1536 preferred
- **Format**: PNG (lossless for line art)
- **Style**: Black and white line art, hand-drawn aesthetic
- **Grid**: Subtle 5ft square grid visible
- **Scale**: 1 pixel = 1 foot (or appropriate scale for readability)

### Storage

- **Bucket**: `dungeon-maps` in Supabase Storage
- **Path**: `{dungeon_id}/{level_index}.png`
- **RLS**: Public read, world owner write

### Cost Considerations

- Cloudflare Workers AI: ~$0.001 per image (estimate)
- Storage: Minimal cost for line art PNGs
- Caching reduces regeneration costs

## Example Prompts

### Small Dungeon (5 rooms)

```
Create a top-down dungeon map in hand-drawn black and white style, similar to classic D&D maps.

Map layout:
- Entry room at (5,5), 15x15 feet, stone floor
- Corridor 5ft wide from (5,5) north to (5,10)
- Chamber at (5,10), 20x20 feet, connected north
- Corridor east from (5,10) to (10,10)
- Storage room at (10,10), 15x10 feet
- Corridor south from (10,10) to (10,15)
- Guard post at (10,15), 10x10 feet

Style: Clean black lines on white, hand-drawn aesthetic, 5ft grid visible, no color fills.
```

### Cave System

```
Create a top-down cave map in hand-drawn black and white style.

Natural cave layout:
- Entrance at (10,5), irregular 20x15 feet
- Natural passage winding northeast to (15,10)
- Large cavern at (15,10), irregular 30x25 feet
- Narrow passage south to (15,20)
- Small cave at (15,20), 15x15 feet
- Water pool in center of large cavern

Style: Organic, irregular walls, natural stone, hand-drawn lines, 5ft grid.
```

## Success Criteria

1. **Visual Quality**
   - Maps look like professional hand-drawn D&D maps
   - Clear, readable, artistic
   - Comparable to Dyson Logos or Mike Schley style

2. **Functionality**
   - Fast generation (< 10 seconds)
   - Reliable (95%+ success rate)
   - Consistent style across generations

3. **User Experience**
   - Maps are immediately usable at tabletop
   - Printable quality
   - Clear room boundaries and features

## Next Steps

1. ✅ Delete existing texture files
2. ⏳ Create layout-to-prompt converter
3. ⏳ Implement AI image generation function
4. ⏳ Integrate with dungeon generation API
5. ⏳ Update React components
6. ⏳ Test and refine prompts
7. ⏳ Deploy and gather feedback

## References

- [Sly Flourish: The Only Dungeon Map You'll Ever Need](https://slyflourish.com/your_only_dungeon_map.html)
- [Rand Roll: Dungeon Map Generators Guide](https://www.randroll.com/dungeon-map-generators-guide/)
- Dyson Logos maps: https://dysonlogos.blog/
- Mike Schley maps: https://mikeschley.com/

