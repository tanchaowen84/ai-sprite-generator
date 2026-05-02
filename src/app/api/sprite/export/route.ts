import { buildSpriteForgeExport } from '@/lib/sprite-forge/postprocess';
import {
  type SpriteActionPack,
  type SpritePlatform,
  buildSpriteForgePlan,
} from '@/lib/sprite-forge/prompt';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const exportSchema = z.object({
  imageUrl: z.string().min(1),
  prompt: z.string().trim().min(1).max(1200),
  platform: z.enum(['unity', 'godot']),
  actionPack: z.enum(['platformer', 'top-down', 'action-rpg', 'custom']),
  notes: z.string().trim().max(500).optional(),
  taskId: z.string().trim().max(200).optional(),
  format: z.enum(['zip', 'sheet', 'atlas', 'metadata', 'gif']).default('zip'),
});

function fileHeaders({
  filename,
  contentType,
}: {
  filename: string;
  contentType: string;
}) {
  return {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  };
}

async function fetchImageBuffer(imageUrl: string, request: Request) {
  const url = new URL(imageUrl, request.url);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Unsupported image URL');
  }

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch generated image: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('image/')) {
    throw new Error('Generated result is not an image');
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function POST(request: Request) {
  try {
    const body = exportSchema.parse(await request.json());
    const plan = buildSpriteForgePlan({
      prompt: body.prompt,
      platform: body.platform as SpritePlatform,
      actionPack: body.actionPack as SpriteActionPack,
      notes: body.notes,
    });
    const sourceImage = await fetchImageBuffer(body.imageUrl, request);
    const result = await buildSpriteForgeExport({
      sourceImage,
      plan,
      platform: body.platform,
      actionPack: body.actionPack,
      originalPrompt: body.prompt,
      taskId: body.taskId,
    });

    if (body.format === 'sheet') {
      return new NextResponse(result.transparentSheet, {
        headers: fileHeaders({
          filename: 'sheet-transparent.png',
          contentType: 'image/png',
        }),
      });
    }

    if (body.format === 'atlas') {
      return NextResponse.json(result.atlas, {
        headers: {
          'Content-Disposition': 'attachment; filename="atlas.json"',
        },
      });
    }

    if (body.format === 'metadata') {
      return NextResponse.json(result.metadata, {
        headers: {
          'Content-Disposition': 'attachment; filename="pipeline-meta.json"',
        },
      });
    }

    if (body.format === 'gif') {
      return new NextResponse(result.animationGif, {
        headers: fileHeaders({
          filename: 'animation.gif',
          contentType: 'image/gif',
        }),
      });
    }

    return new NextResponse(result.zip, {
      headers: fileHeaders({
        filename: 'sprite-pack.zip',
        contentType: 'application/zip',
      }),
    });
  } catch (error) {
    console.error('[sprite.export] Failed to export sprite pack', error);

    return NextResponse.json(
      { error: 'Failed to export sprite pack. Please try again.' },
      { status: 400 }
    );
  }
}
