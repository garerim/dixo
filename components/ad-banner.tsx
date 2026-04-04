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

/**
 * Google AdSense banner component.
 * - Hidden for Premium / VIP subscribers.
 * - Requires NEXT_PUBLIC_ADSENSE_CLIENT_ID env var.
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
