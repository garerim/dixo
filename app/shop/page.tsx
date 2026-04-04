"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Dice5,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { AdBanner } from "@/components/ad-banner";
import { useOwnedSkins } from "@/features/shop/hooks/use-owned-skins";
import { shopClient } from "@/features/shop/api/shop-client";
import { DiceFace } from "@/features/game/components/dice-face";
import { SKIN_CATALOG, type SkinDefinition } from "@/lib/skins/catalog";

export default function ShopPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { ownedSkinIds, isLoading: skinsLoading } = useOwnedSkins();
  const router = useRouter();
  const t = useTranslations("shop");
  const ts = useTranslations("skins");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  if (authLoading || skinsLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !profile) {
    router.push("/login");
    return null;
  }

  const purchasableSkins = SKIN_CATALOG.filter((s) => s.purchasable && !s.free && s.id !== null);

  function isOwned(skinId: string): boolean {
    return ownedSkinIds.includes(skinId);
  }

  async function handleBuy(skin: SkinDefinition) {
    if (!skin.id) return;

    setBuyingId(skin.id);
    const result = await shopClient.purchaseSkin(skin.id);

    if (result.success && result.data?.url) {
      window.location.assign(result.data.url);
    } else {
      toast.error(result.error ?? t("checkoutError"));
      setBuyingId(null);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 sm:p-6">
        {/* Intro */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t("heading")}</h2>
          <p className="mt-1 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* Ad between intro and skins grid */}
        <AdBanner slot="ADSENSE_SHOP_SLOT" format="horizontal" />

        {/* Skins grid */}
        {purchasableSkins.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ShoppingBag className="size-10" />
            <p>{t("noSkins")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {purchasableSkins.map((skin) => {
              const owned = skin.id ? isOwned(skin.id) : false;
              const isBuying = buyingId === skin.id;

              return (
                <Card key={skin.id} className={cn("overflow-hidden", owned && "border-green-500/40")}>
                  {/* Dice preview row */}
                  <div className="flex items-center justify-center gap-1.5 bg-muted/50 px-4 py-5">
                    {[1, 2, 3, 4, 5, 6].map((v) => (
                      <DiceFace
                        key={v}
                        value={v}
                        size="md"
                        skin={skin.id ?? undefined}
                      />
                    ))}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{skin.name}</CardTitle>
                      {owned ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="size-3" />
                          {t("owned")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-bold">
                          {skin.price.toFixed(2)} &euro;
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{ts(skin.descriptionKey)}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {owned ? (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        asChild
                      >
                        <Link href="/skins">
                          <Dice5 className="size-4" />
                          {t("equipInMySkins")}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleBuy(skin)}
                        disabled={isBuying}
                      >
                        {isBuying ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="size-4" />
                        )}
                        {t("buyFor", { price: skin.price.toFixed(2) })}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          {t("stripeNote")}
        </p>
      </main>
    </div>
  );
}
