'use client';

import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    prices: {
      month: '$12',
      year: '$120',
    },
    periods: {
      month: '/month',
      year: '/year',
    },
    credits: {
      month: '30 sprite credits / month',
      year: '360 sprite credits / year',
    },
    badge: 'Solo dev',
    body: 'For game jams and solo prototypes when you need enough credits to try several sprite directions.',
    cta: 'Choose Starter',
    accent: 'bg-[#dff4e8]',
    shadow: 'shadow-[10px_10px_0_#d8cec0]',
    features: [
      'Prompt-to-sprite generation',
      'Reference image assisted generation',
      'Basic and common action packs',
      'PNG, GIF, JSON, and ZIP exports',
      'Prompt and metadata included',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    prices: {
      month: '$29',
      year: '$290',
    },
    periods: {
      month: '/month',
      year: '/year',
    },
    credits: {
      month: '100 sprite credits / month',
      year: '1,200 sprite credits / year',
    },
    badge: 'More credits',
    body: 'For active indie builders and small teams using AI Sprite Generator across more character ideas, action packs, and engine checks.',
    cta: 'Choose Pro',
    accent: 'bg-[#fff1a8]',
    shadow: 'shadow-[12px_12px_0_#241b15]',
    featured: true,
    features: [
      'Everything in Starter',
      'Custom action prompts',
      'More monthly sprite credits',
      'Reference image assisted generation',
      'PNG, GIF, JSON, and ZIP exports',
    ],
  },
];

type BillingInterval = 'month' | 'year';

export function SpritePricingSection({
  ctaHref = '/#generator',
}: {
  ctaHref?: string;
}) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const isYearly = billingInterval === 'year';

  return (
    <section id="pricing" className="bg-[#f4e8ff] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f6257]">
            Credits
          </p>
          <h2 className="mt-3 font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-6xl">
            Credit plans
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6f6257]">
            AI Sprite Generator uses credits because every generation has a real
            cost. Starter is for light exploration. Pro is for builders testing
            more characters each month.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border-2 border-[#241b15] bg-white p-1 shadow-[5px_5px_0_#d8cec0]">
            {(['month', 'year'] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setBillingInterval(interval)}
                className={cn(
                  'cursor-pointer rounded-full px-5 py-2 text-sm font-black transition',
                  billingInterval === interval
                    ? 'bg-[#241b15] text-white'
                    : 'text-[#241b15] hover:bg-[#f7f2ea]'
                )}
              >
                {interval === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'flex h-full flex-col rounded-[2rem] border-2 border-[#241b15] bg-white p-6',
                plan.shadow,
                plan.featured && 'bg-[#fffaf0]'
              )}
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={cn(
                    'rounded-full border border-[#241b15] px-3 py-1 text-xs font-black uppercase tracking-[0.14em]',
                    plan.accent
                  )}
                >
                  {plan.badge}
                </span>
                {plan.featured ? (
                  <span className="rounded-full bg-[#241b15] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
                    {isYearly ? '2 months free' : 'More monthly runs'}
                  </span>
                ) : null}
              </div>

              <h3 className="font-bricolage-grotesque text-4xl font-black tracking-normal text-[#241b15]">
                {plan.name}
              </h3>
              <div className="mt-5 flex items-end gap-2">
                <span className="font-bricolage-grotesque text-6xl font-black leading-none tracking-normal text-[#241b15]">
                  {plan.prices[billingInterval]}
                </span>
                <span className="pb-2 text-lg font-black text-[#6f6257]">
                  {plan.periods[billingInterval]}
                </span>
              </div>
              <p className="mt-4 inline-flex w-fit rounded-full bg-[#e7f8ed] px-4 py-2 text-sm font-black text-[#1d6f50]">
                {plan.credits[billingInterval]}
              </p>
              {isYearly ? (
                <p className="mt-3 text-sm font-bold text-[#8a7e70]">
                  Annual billing uses the 10-month price.
                </p>
              ) : null}
              <p className="mt-5 min-h-16 leading-7 text-[#6f6257]">
                {plan.body}
              </p>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-bold text-[#4f443b]"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1d8d63]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={ctaHref}
                className={cn(
                  'mt-8 inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#241b15] px-5 py-3 font-black transition hover:-translate-y-0.5',
                  plan.featured
                    ? 'bg-[#241b15] text-white shadow-[0_6px_0_#00000040]'
                    : 'bg-white text-[#241b15]'
                )}
              >
                {plan.cta}
                <ArrowRight className="size-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
