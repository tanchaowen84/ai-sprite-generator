import { submitSpriteImageGeneration } from '@/lib/apimart';
import { buildSpriteForgePlan } from '@/lib/sprite-forge/prompt';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().trim().min(8).max(1200),
  platform: z.enum(['unity', 'godot']),
  actionPack: z.enum(['platformer', 'top-down', 'action-rpg', 'custom']),
  notes: z.string().trim().max(500).optional(),
  referenceImageDataUrl: z
    .string()
    .startsWith('data:image/')
    .max(8_000_000)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const plan = buildSpriteForgePlan({
      prompt: body.prompt,
      platform: body.platform,
      actionPack: body.actionPack,
      notes: body.notes,
    });

    const result = await submitSpriteImageGeneration({
      prompt: plan.prompt,
      imageUrls: body.referenceImageDataUrl
        ? [body.referenceImageDataUrl]
        : undefined,
    });

    return NextResponse.json({
      ...result,
      rows: plan.rows,
      cols: plan.cols,
      cellSize: plan.cellSize,
      frameLabels: plan.frameLabels,
    });
  } catch (error) {
    console.error('[sprite.generate] Failed to start generation', error);

    return NextResponse.json(
      { error: 'Failed to start generation. Please try again.' },
      { status: 400 }
    );
  }
}
