import { getSpriteGenerationTask } from '@/lib/apimart';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId query parameter' },
        { status: 400 }
      );
    }

    const task = await getSpriteGenerationTask(taskId);
    const imageUrl = task.data?.result?.images?.[0]?.url?.[0] ?? null;

    return NextResponse.json({
      id: task.data?.id ?? taskId,
      status: task.data?.status ?? 'pending',
      progress: task.data?.progress ?? 0,
      imageUrl,
      error: task.data?.error
        ? 'Generation failed. Please adjust your prompt and try again.'
        : undefined,
      estimatedTime: task.data?.estimated_time,
      actualTime: task.data?.actual_time,
    });
  } catch (error) {
    console.error('[sprite.status] Failed to query generation', error);

    return NextResponse.json(
      { error: 'Failed to query generation status. Please try again.' },
      { status: 400 }
    );
  }
}
