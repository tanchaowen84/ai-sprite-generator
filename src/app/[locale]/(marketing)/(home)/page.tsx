import { SpriteGeneratorPage } from '@/components/sections/ai-sprite';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;

  return constructMetadata({
    title: 'AI Sprite Generator - Engine-ready 2D sprite sheets',
    description:
      'Generate 2D character sprite sheets for Unity and Godot from a prompt or reference image. Built for indie game prototypes and vertical slices.',
    canonicalUrl: getUrlWithLocale('', locale),
  });
}

export default async function HomePage() {
  return <SpriteGeneratorPage />;
}
