type CreemModerationDecision = 'allow' | 'flag' | 'deny';

type CreemModerationResponse = {
  id?: string;
  decision?: CreemModerationDecision;
  reason?: string;
  model?: string;
};

const MODERATION_TIMEOUT_MS = 8000;

class ContentModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentModerationError';
  }
}

function getCreemApiUrl() {
  return process.env.CREEM_API_URL ?? 'https://api.creem.io';
}

function getCreemApiKey() {
  const apiKey = process.env.CREEM_API_KEY;

  if (!apiKey) {
    throw new ContentModerationError('Content safety is not configured');
  }

  return apiKey;
}

function normalizeDecision(value: unknown): CreemModerationDecision | null {
  if (value === 'allow' || value === 'flag' || value === 'deny') {
    return value;
  }

  return null;
}

export async function assertPromptIsAllowed({
  prompt,
  metadata,
}: {
  prompt: string;
  metadata?: Record<string, string>;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS);

  try {
    const response = await fetch(`${getCreemApiUrl()}/v1/moderation/prompt`, {
      method: 'POST',
      headers: {
        'x-api-key': getCreemApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        metadata,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as CreemModerationResponse) : {};

    if (!response.ok) {
      throw new ContentModerationError('Content safety check failed');
    }

    const decision = normalizeDecision(data.decision);
    if (decision !== 'allow') {
      throw new ContentModerationError('This request cannot be processed');
    }
  } catch (error) {
    if (error instanceof ContentModerationError) {
      throw error;
    }

    throw new ContentModerationError('Content safety check failed');
  } finally {
    clearTimeout(timeout);
  }
}
