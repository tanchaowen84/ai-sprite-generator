import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getDb } from '@/db';
import { payment, user as userTable } from '@/db/schema';
import { LocaleLink } from '@/i18n/navigation';
import { findPlanByPriceId } from '@/lib/price-plan';
import { getSession } from '@/lib/server';
import { Routes } from '@/routes';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  ArrowRightIcon,
  CreditCardIcon,
  DownloadIcon,
  ImageIcon,
  SparklesIcon,
  UserCircleIcon,
  WalletCardsIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

/**
 * Dashboard page
 */
export default async function DashboardPage() {
  const t = await getTranslations();
  const session = await getSession();
  const currentUser = session?.user;

  const db = await getDb();
  const [userRecord] = currentUser
    ? await db
        .select({
          credits: userTable.credits,
        })
        .from(userTable)
        .where(eq(userTable.id, currentUser.id))
        .limit(1)
    : [];

  const [activePayment] = currentUser
    ? await db
        .select({
          priceId: payment.priceId,
          status: payment.status,
          interval: payment.interval,
        })
        .from(payment)
        .where(
          and(
            eq(payment.userId, currentUser.id),
            inArray(payment.status, ['active', 'trialing', 'completed'])
          )
        )
        .orderBy(desc(payment.createdAt))
        .limit(1)
    : [];

  const currentPlan = activePayment
    ? findPlanByPriceId(activePayment.priceId)
    : undefined;
  const planName = currentPlan
    ? getPlanLabel(currentPlan.id)
    : 'Free workspace';
  const planStatus = activePayment?.status
    ? activePayment.status.charAt(0).toUpperCase() +
      activePayment.status.slice(1)
    : 'Free';
  const credits = userRecord?.credits ?? 0;

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <main className="flex flex-1 flex-col bg-[#fbf7ef]">
        <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-[#2b211b]/15 bg-white shadow-none">
              <CardHeader className="gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-emerald-900/20 bg-emerald-50 text-emerald-900"
                  >
                    AI Sprite Generator workspace
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#2b211b]/15 bg-[#f4e8ff] text-[#2b211b]"
                  >
                    {planStatus}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <CardTitle className="max-w-3xl text-3xl font-black tracking-normal text-[#2b211b] md:text-4xl">
                    Continue creating playable sprite packs.
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base text-[#6b625b]">
                    Jump back to the generator, review your credits, or open
                    billing without leaving the product workflow.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[#2b211b] text-white hover:bg-[#3a2e26]"
                >
                  <LocaleLink href="/#generator">
                    Open generator
                    <ArrowRightIcon className="size-4" />
                  </LocaleLink>
                </Button>
                <Button asChild variant="outline">
                  <LocaleLink href={Routes.SettingsBilling}>
                    View billing
                  </LocaleLink>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#2b211b]/15 bg-white shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <WalletCardsIcon className="size-5 text-emerald-800" />
                  Sprite credits
                </CardTitle>
                <CardDescription>
                  Credits available for generation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black tracking-normal text-[#2b211b]">
                  {credits}
                </div>
                <p className="mt-3 text-sm text-[#6b625b]">
                  Your balance updates after successful payment and credit
                  events.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <WorkspaceCard
              icon={<SparklesIcon className="size-5" />}
              title="Current plan"
              description="Your active plan and billing status."
              action={
                <Button asChild size="sm" variant="outline">
                  <LocaleLink href={Routes.SettingsBilling}>Manage</LocaleLink>
                </Button>
              }
            >
              <div className="space-y-2">
                <div className="text-2xl font-black text-[#2b211b]">
                  {planName}
                </div>
                <div className="text-sm text-[#6b625b]">
                  {activePayment?.interval
                    ? `Billed ${activePayment.interval}`
                    : 'No paid plan yet'}
                </div>
              </div>
            </WorkspaceCard>

            <WorkspaceCard
              icon={<ImageIcon className="size-5" />}
              title="Recent sprite packs"
              description="Generated packs are reviewed and downloaded on the generator page."
              action={
                <Button asChild size="sm" variant="outline">
                  <LocaleLink href="/#generator">Create</LocaleLink>
                </Button>
              }
            >
              <EmptyState text="No saved sprite packs are shown here. Generate a pack from the homepage and download it from the result panel." />
            </WorkspaceCard>

            <WorkspaceCard
              icon={<DownloadIcon className="size-5" />}
              title="Exports"
              description="Download files from the generator result panel."
              action={
                <Button asChild size="sm" variant="outline">
                  <LocaleLink href="/#generator">Open</LocaleLink>
                </Button>
              }
            >
              <EmptyState text="ZIP, PNG frames, GIF, and atlas JSON exports are available once a sprite result is ready." />
            </WorkspaceCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="border-[#2b211b]/15 bg-white shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="size-5 text-emerald-800" />
                  Billing and credits
                </CardTitle>
                <CardDescription>
                  Upgrade when you need more monthly sprite credits.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <LocaleLink href={Routes.Pricing}>Compare plans</LocaleLink>
                </Button>
                <Button asChild variant="outline">
                  <LocaleLink href={Routes.SettingsBilling}>
                    Billing settings
                  </LocaleLink>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#2b211b]/15 bg-white shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircleIcon className="size-5 text-emerald-800" />
                  Account
                </CardTitle>
                <CardDescription>
                  Keep your profile details up to date.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <LocaleLink href={Routes.SettingsProfile}>
                    Profile settings
                  </LocaleLink>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}

function WorkspaceCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-[#2b211b]/15 bg-white shadow-none">
      <CardHeader>
        <CardAction>{action}</CardAction>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-emerald-800">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#2b211b]/20 bg-[#fbf7ef] p-4 text-sm leading-6 text-[#6b625b]">
      {text}
    </div>
  );
}

function getPlanLabel(planId: string) {
  switch (planId) {
    case 'starter':
      return 'Starter Plan';
    case 'pro':
      return 'Pro Plan';
    case 'free':
      return 'Free workspace';
    default:
      return 'Current plan';
  }
}