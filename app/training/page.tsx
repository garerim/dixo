"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Zap,
  Brain,
  Flame,
  Users,
  Swords,
  Play,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { BotDifficulty } from "@/core/bot";

type BotCount = 1 | 3;
type DiceCount = 3 | 5 | 7;

export default function TrainingPage() {
  const t = useTranslations("training");
  const router = useRouter();

  const [botCount, setBotCount] = useState<BotCount>(1);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("medium");
  const [diceCount, setDiceCount] = useState<DiceCount>(5);
  const [pacosWild, setPacosWild] = useState(true);

  const handleStart = () => {
    const params = new URLSearchParams({
      bots: String(botCount),
      difficulty,
      dice: String(diceCount),
      pacos: String(pacosWild),
    });
    router.push(`/training/play?${params.toString()}`);
  };

  const difficulties: {
    value: BotDifficulty;
    icon: typeof Zap;
    color: string;
    selectedBg: string;
  }[] = [
    {
      value: "easy",
      icon: Zap,
      color: "text-green-500",
      selectedBg: "border-green-500/50 bg-green-500/10",
    },
    {
      value: "medium",
      icon: Brain,
      color: "text-yellow-500",
      selectedBg: "border-yellow-500/50 bg-yellow-500/10",
    },
    {
      value: "hard",
      icon: Flame,
      color: "text-red-500",
      selectedBg: "border-red-500/50 bg-red-500/10",
    },
  ];

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Dixo" width={28} height={28} className="rounded-md" />
          <span className="text-lg font-bold tracking-tight">Dixo</span>
        </div>
        <Badge variant="secondary" className="ml-2 gap-1">
          <Bot className="size-3" />
          {t("badge")}
        </Badge>
      </header>

      {/* ── Content ── */}
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg space-y-6"
        >
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {/* ── Mode selection ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("mode")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBotCount(1)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                  botCount === 1
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <Swords className="size-6 text-primary" />
                <span className="text-sm font-medium">{t("1v1")}</span>
              </button>
              <button
                onClick={() => setBotCount(3)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                  botCount === 3
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <Users className="size-6 text-primary" />
                <span className="text-sm font-medium">{t("4players")}</span>
              </button>
            </CardContent>
          </Card>

          {/* ── Difficulty ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("difficulty")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {difficulties.map((d) => {
                const Icon = d.icon;
                const selected = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                      selected
                        ? d.selectedBg
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    <Icon className={cn("size-5", d.color)} />
                    <span className="text-sm font-medium">
                      {t(d.value)}
                    </span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">
                      {t(`${d.value}Desc`)}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* ── Settings ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dice count */}
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("diceCount")}</span>
                <div className="flex gap-2">
                  {([3, 5, 7] as DiceCount[]).map((n) => (
                    <button
                      key={n}
                      onClick={() => setDiceCount(n)}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-all",
                        diceCount === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pacos wild */}
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("pacosWild")}</span>
                <Switch checked={pacosWild} onCheckedChange={setPacosWild} />
              </div>
            </CardContent>
          </Card>

          {/* ── Start ── */}
          <Button size="lg" className="w-full gap-2 text-base" onClick={handleStart}>
            <Play className="size-5" />
            {t("start")}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
