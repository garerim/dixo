"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";

function detectWebView(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/snapchat/i.test(ua)) return "Snapchat";
  if (/instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/musical_ly|tiktok|bytedance/i.test(ua)) return "TikTok";
  if (/twitter|x\.com/i.test(ua)) return "X";
  if (/linkedin/i.test(ua)) return "LinkedIn";
  if (/discord/i.test(ua)) return "Discord";
  // Generic WebView detection (Android WebView or iOS without Safari)
  if (/wv|WebView/i.test(ua)) return "cette application";
  if (/iPhone|iPad/.test(ua) && !/Safari/.test(ua)) return "cette application";
  return null;
}

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const t = useTranslations("login");
  const [copied, setCopied] = useState(false);

  const webViewApp = useMemo(() => detectWebView(), []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user && !isLoading) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Dixo" width={64} height={64} className="size-16 drop-shadow-lg" />
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-center max-w-xs">
          {t("subtitle")}
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t("heading")}</CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {webViewApp ? (
            <>
              <p className="text-sm text-center text-muted-foreground">
                {t("webviewBlocked", { app: webViewApp })}
              </p>
              <Button
                size="lg"
                className="w-full gap-3"
                onClick={() => {
                  window.open(window.location.href, "_system");
                }}
                asChild
              >
                <a href={typeof window !== "undefined" ? window.location.href : "#"} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-5" />
                  {t("webviewOpenBrowser")}
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3"
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.origin + "/login");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
                {copied ? t("webviewCopied") : t("webviewCopy")}
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              className="w-full gap-3"
              onClick={signInWithGoogle}
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("continueWithGoogle")}
            </Button>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        {t("fairPlay")}
      </p>
    </div>
  );
}
