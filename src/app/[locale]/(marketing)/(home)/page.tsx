import {
  SpriteGeneratorPage,
  spriteFaqs,
} from '@/components/sections/ai-sprite';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';

const seoTitle = 'AI Sprite Generator - Create Game Sprite Sheets Fast';
const seoDescription =
  'AI Sprite Generator for indie game devs. Create engine-ready sprite sheets, transparent PNGs, GIFs, and atlas JSON from a prompt or reference image. Try free.';
const ogImage = '/images/ai-sprite/og-ai-sprite-generator.png';

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
    title: seoTitle,
    description: seoDescription,
    canonicalUrl: getUrlWithLocale('', locale),
    image: ogImage,
  });
}

export default async function HomePage() {
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Sprite Generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description: seoDescription,
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '12',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '29',
        priceCurrency: 'USD',
      },
    ],
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: spriteFaqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        id="ai-sprite-web-application-schema"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static product metadata.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />
      <script
        id="ai-sprite-faq-schema"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static FAQ metadata.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <SpriteGeneratorPage />
    </>
  );
}
