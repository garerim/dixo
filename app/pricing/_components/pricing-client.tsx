"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Loader2,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useBilling } from "@/features/billing/hooks/use-billing";

const FREE_FEATURE_KEYS = [
  "freeFeatures.normalRanked",
  "freeFeatures.friends",
  "freeFeatures.chat",
  "freeFeatures.eloRanking",
  "freeFeatures.avatar",
] as const;

const PREMIUM_FEATURE_KEYS = [
  "premiumFeatures.everythingInFree",
  "premiumFeatures.gifAvatar",
  "premiumFeatures.fullEloHistory",
  "premiumFeatures.premiumBadge",
] as const;

export function PricingClient() {
  const router = useRouter();
  const t = useTranslations("pricing");
  const { profile } = useAuth();
  const { isLoading, checkout } = useBilling();

  const isPremium =
    profile?.subscription === "premium" || profile?.subscription === "vip";

  async function handleCheckout() {
    const result = await checkout();
    if (!result.success) {
      toast.error(result.error ?? "Unable to start checkout. Please try again.");
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Dixo" width={28} height={28} className="size-7" />
          <span className="text-lg font-bold tracking-tight">{t("title")}</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("heading")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid w-full gap-6 sm:grid-cols-2">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5 text-muted-foreground" />
                {t("free")}
              </CardTitle>
              <CardDescription>{t("freeDesc")}</CardDescription>
              <p className="text-3xl font-bold">
                {t("freePrice")}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {FREE_FEATURE_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-muted-foreground" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                {t("currentPlan")}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="flex flex-col border-primary ring-1 ring-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  {t("premium")}
                </CardTitle>
                <Badge>{t("popular")}</Badge>
              </div>
              <CardDescription>{t("premiumDesc")}</CardDescription>
              <p className="text-3xl font-bold">
                {t("premiumPrice")}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {PREMIUM_FEATURE_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-primary" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isPremium ? (
                <Button className="w-full" disabled>
                  <Star className="mr-2 size-4" />
                  {t("youArePremium")}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Star className="mr-2 size-4" />
                  )}
                  {t("getPremium")}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t("cancelNote")}
        </p>
      </main>
    </div>
  );
}
