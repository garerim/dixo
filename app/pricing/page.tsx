"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Dice5,
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

const FREE_FEATURES = [
  "Normal & Ranked games",
  "Friends system",
  "In-game chat",
  "ELO ranking (last 10 entries)",
  "JPEG / PNG / WebP avatar",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "GIF avatar support",
  "Full ELO history (200+ entries)",
  "Premium badge on your profile & in-game",
];

export default function PricingPage() {
  const router = useRouter();
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
          <Dice5 className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Pricing</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Upgrade to Premium
          </h1>
          <p className="mt-2 text-muted-foreground">
            Support Dixo and unlock exclusive perks.
          </p>
        </div>

        <div className="grid w-full gap-6 sm:grid-cols-2">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5 text-muted-foreground" />
                Free
              </CardTitle>
              <CardDescription>All the essentials, forever free.</CardDescription>
              <p className="text-3xl font-bold">
                €0
                <span className="text-base font-normal text-muted-foreground">
                  /month
                </span>
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-muted-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Current plan
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="flex flex-col border-primary ring-1 ring-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  Premium
                </CardTitle>
                <Badge>Popular</Badge>
              </div>
              <CardDescription>The full Dixo experience.</CardDescription>
              <p className="text-3xl font-bold">
                €4.99
                <span className="text-base font-normal text-muted-foreground">
                  /month
                </span>
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isPremium ? (
                <Button className="w-full" disabled>
                  <Star className="mr-2 size-4" />
                  You are Premium!
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
                  Get Premium
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Cancel anytime from your profile. Payments are handled securely by Stripe.
        </p>
      </main>
    </div>
  );
}
