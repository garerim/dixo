"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  className?: string;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Google AdSense banner component.
 * - Hidden for Premium / VIP subscribers.
 * - Requires NEXT_PUBLIC_ADSENSE_CLIENT_ID env var.
 * - In development, shows a red placeholder to visualize ad placement.
 */
export function AdBanner({ slot, format = "auto", className }: AdBannerProps) {
  const { profile } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const isPremium =
    profile?.subscription === "premium" || profile?.subscription === "vip";

  useEffect(() => {
    if (isPremium || pushed.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded yet or ad-blocker active — fail silently
    }
  }, [isPremium]);

  // Don't render anything for Premium users
  if (isPremium) return null;

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className={cn("flex w-full items-center justify-center", className)}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Layout wrapper that places vertical ad banners on each side of the content.
 * Ads are hidden on mobile/tablet and only visible on xl+ screens.
 */
export function AdSidebarLayout({
  children,
  slotLeft,
  slotRight,
}: {
  children: React.ReactNode;
  slotLeft: string;
  slotRight: string;
}) {
  return (
    <div className="flex w-full justify-center gap-4">
      {/* Left ad — hidden below xl */}
      <aside className="hidden xl:flex sticky top-4 h-fit w-[160px] shrink-0 items-start pt-4">
        <AdBanner slot={slotLeft} format="vertical" className="w-[160px]" />
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {children}
      </div>

      {/* Right ad — hidden below xl */}
      <aside className="hidden xl:flex sticky top-4 h-fit w-[160px] shrink-0 items-start pt-4">
        <AdBanner slot={slotRight} format="vertical" className="w-[160px]" />
      </aside>
    </div>
  );
}
