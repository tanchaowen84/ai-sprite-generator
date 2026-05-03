const APIMART_BASE_URL =
  process.env.APIMART_BASE_URL ?? 'https://api.apimart.ai';

type ApimartErrorBody = {
  error?: {
    code?: number;
    message?: string;
    type?: string;
  };
};

type ApimartGenerationResponse = {
  code?: number;
  data?:
    | Array<{
        status?: string;
        task_id?: string;
      }>
    | {
        status?: string;
        task_id?: string;
      };
};

export type ApimartTaskResponse = {
  code?: number;
  data?: {
    id?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    result?: {
      images?: Array<{
        url?: string[];
        expires_at?: number;
      }>;
    };
    error?: {
      code?: number;
      message?: string;
      type?: string;
    };
    estimated_time?: number;
    actual_time?: number;
  };
};

function getApiKey() {
  const apiKey = process.env.APIMART_API_KEY;

  if (!apiKey) {
    throw new Error('APIMART_API_KEY is not configured');
  }

  return apiKey;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      (data as ApimartErrorBody).error?.message ??
      `Image generation provider request failed with status ${response.status}`;
    throw new Error(message);
  }

  if ((data as ApimartErrorBody).error?.message) {
    throw new Error((data as ApimartErrorBody).error?.message);
  }

  return data as T;
}

export async function submitSpriteImageGeneration({
  prompt,
  imageUrls,
}: {
  prompt: string;
  imageUrls?: string[];
}) {
  const payload = {
    model: 'gpt-image-2',
    prompt,
    n: 1,
    size: '1:1',
    ...(imageUrls?.length ? { image_urls: imageUrls } : {}),
  };

  const response = await fetch(`${APIMART_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse<ApimartGenerationResponse>(response);
  const firstTask = Array.isArray(data.data) ? data.data[0] : data.data;
  const taskId = firstTask?.task_id;

  if (!taskId) {
    throw new Error('Image generation provider did not return a task id');
  }

  return {
    taskId,
    status: firstTask?.status ?? 'submitted',
  };
}

export async function getSpriteGenerationTask(taskId: string) {
  const url = new URL(`${APIMART_BASE_URL}/v1/tasks/${taskId}`);
  url.searchParams.set('language', 'en');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    cache: 'no-store',
  });

  return parseJsonResponse<ApimartTaskResponse>(response);
}
