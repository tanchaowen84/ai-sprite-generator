import { PaymentTypes, PlanIntervals } from '@/payment/types';
import type { WebsiteConfig } from '@/types';

/**
 * website config, without translations
 *
 * docs:
 * https://mksaas.com/docs/config/website
 */
export const websiteConfig: WebsiteConfig = {
  metadata: {
    theme: {
      defaultTheme: 'default',
      enableSwitch: true,
    },
    mode: {
      defaultMode: 'light',
      enableSwitch: false,
    },
    images: {
      ogImage: '/og.png',
      logoLight: '/logo.png',
      logoDark: '/logo-dark.png',
    },
    social: {
      github: '',
      twitter: '',
      blueSky: '',
      discord: '',
      mastodon: '',
      linkedin: '',
      youtube: '',
    },
  },
  features: {
    enableDiscordWidget: false,
    enableUpgradeCard: true,
    enableAffonsoAffiliate: false,
    enablePromotekitAffiliate: false,
    enableDocsPage: false,
    enableBlogPage: false,
    enableAIPages: false,
    enableMagicUIPage: false,
    enableBlocksPages: false,
  },
  routes: {
    defaultLoginRedirect: '/',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: false,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: {
        flag: '🇺🇸',
        name: 'English',
      },
      // zh: {
      //   flag: '🇨🇳',
      //   name: '中文',
      // },
    },
  },
  blog: {
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  mail: {
    provider: 'resend',
    fromEmail: 'AI Sprite Generator <support@aispritegenerator.com>',
    supportEmail: 'AI Sprite Generator <support@aispritegenerator.com>',
  },
  newsletter: {
    provider: 'resend',
    autoSubscribeAfterSignUp: true,
  },
  storage: {
    provider: 's3',
  },
  payment: {
    provider: 'creem',
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
      },
      // ========== Stripe Configuration (Commented Out) ==========
      // pro: {
      //   id: 'pro',
      //   prices: [
      //     {
      //       type: PaymentTypes.SUBSCRIPTION,
      //       priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
      //       amount: 990,
      //       currency: 'USD',
      //       interval: PlanIntervals.MONTH,
      //     },
      //     {
      //       type: PaymentTypes.SUBSCRIPTION,
      //       priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
      //       amount: 9900,
      //       currency: 'USD',
      //       interval: PlanIntervals.YEAR,
      //     },
      //   ],
      //   isFree: false,
      //   isLifetime: false,
      //   recommended: true,
      // },

      // ========== Creem Configuration ==========
      starter: {
        id: 'starter',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_STARTER_MONTHLY!,
            amount: 1200,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_STARTER_YEARLY!,
            amount: 12000,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_PRO_MONTHLY!,
            amount: 2900,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_PRO_YEARLY!,
            amount: 29000,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        recommended: true,
      },
    },
  },
};
