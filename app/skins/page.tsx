"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Loader2,
  Dice5,
  Lock,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { MainHeader } from "@/components/main-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { AdSidebarLayout } from "@/components/ad-banner";
import { profileClient } from "@/features/profile/api/profile-client";
import { useOwnedSkins } from "@/features/shop/hooks/use-owned-skins";
import { DiceFace } from "@/features/game/components/dice-face";
import { SKIN_CATALOG } from "@/lib/skins/catalog";

function SkinsPageContent() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { ownedSkinIds, isLoading: skinsLoading, refresh: refreshSkins } = useOwnedSkins();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("skins");
  const [saving, setSaving] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<string | null | undefined>(undefined);

  // Handle successful purchase redirect
  const purchasedSkin = searchParams.get("purchased");
  useEffect(() => {
    if (purchasedSkin) {
      toast.success(t("purchased"));
      refreshSkins();
      // Clean up URL
      router.replace("/skins");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasedSkin]);

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

  const currentSkin = selectedSkin !== undefined ? selectedSkin : profile.diceSkin;

  /** Check if a skin is owned (free skins are always owned) */
  function isOwned(skinId: string | null): boolean {
    if (skinId === null) return true; // Classic is always owned
    const def = SKIN_CATALOG.find((s) => s.id === skinId);
    if (def?.free) return true;
    return ownedSkinIds.includes(skinId);
  }

  async function handleSave() {
    if (selectedSkin === undefined) return;

    setSaving(true);
    const result = await profileClient.updateProfile({ diceSkin: selectedSkin });
    if (result.success) {
      toast.success("Dice skin updated!");
      await refreshProfile();
    } else {
      toast.error(result.error ?? "Failed to update skin.");
    }
    setSaving(false);
  }

  const hasChanges = selectedSkin !== undefined && selectedSkin !== profile.diceSkin;

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />

      <AdSidebarLayout slotLeft="ADSENSE_SKINS_LEFT" slotRight="ADSENSE_SKINS_RIGHT">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        {/* Preview */}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("preview")}
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <DiceFace
                  key={v}
                  value={v}
                  size="lg"
                  skin={currentSkin ?? undefined}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skin list */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SKIN_CATALOG.map((skin) => {
            const owned = isOwned(skin.id);
            const isSelected = currentSkin === skin.id;
            const isEquipped = profile.diceSkin === skin.id;

            return (
              <button
                key={skin.id ?? "default"}
                onClick={() => {
                  if (owned) setSelectedSkin(skin.id);
                }}
                disabled={!owned}
                className={cn(
                  "relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  owned
                    ? "hover:bg-muted/50"
                    : "cursor-not-allowed opacity-60 grayscale",
                  isSelected && owned
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border",
                )}
              >
                {/* Thumbnail */}
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {skin.preview ? (
                    <Image
                      src={skin.preview}
                      alt={skin.name}
                      width={48}
                      height={48}
                      className={cn("rounded-md", !owned && "blur-[2px]")}
                    />
                  ) : (
                    <DiceFace value={5} size="md" />
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{skin.name}</span>
                    {isEquipped && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {t("equipped")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t(skin.descriptionKey)}
                  </span>
                </div>

                {/* Status */}
                {!owned ? (
                  <Lock className="size-5 shrink-0 text-muted-foreground" />
                ) : isSelected ? (
                  <Check className="size-5 shrink-0 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Save button */}
        {hasChanges && (
          <div className="sticky bottom-4">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {t("equip")}
            </Button>
          </div>
        )}
      </main>
      </AdSidebarLayout>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function SkinsPage() {
  return (
    <SkinsPageContent />
  );
}
