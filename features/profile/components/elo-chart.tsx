"use client";

import { useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { profileClient } from "../api/profile-client";
import type { EloHistoryEntry } from "@/types/api";

// =============================================================================
// Config du chart
// =============================================================================

const chartConfig = {
  elo: {
    label: "ELO",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// =============================================================================
// Types pour les données du chart
// =============================================================================

interface ChartDataPoint {
  date: string;
  elo: number;
  delta: number;
}

// =============================================================================
// Composant
// =============================================================================

interface EloChartProps {
  elo1v1: number;
  elo4p: number;
}

export function EloChart({ elo1v1, elo4p }: EloChartProps) {
  const [mode, setMode] = useState<"1v1" | "4p">("1v1");
  const [history, setHistory] = useState<EloHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentElo = mode === "1v1" ? elo1v1 : elo4p;

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const result = await profileClient.getEloHistory(mode);

      if (result.success && result.data) {
        setHistory(result.data);
      } else {
        setHistory([]);
      }
      setIsLoading(false);
    }
    load();
  }, [mode]);

  // Transform data for the chart
  const chartData: ChartDataPoint[] = history.map((entry) => ({
    date: new Date(entry.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
    elo: entry.elo,
    delta: entry.delta,
  }));

  // Always add the initial point if we have history
  if (chartData.length > 0) {
    const firstEntry = history[0];
    const initialElo = firstEntry.elo - firstEntry.delta;
    chartData.unshift({
      date: "Start",
      elo: initialElo,
      delta: 0,
    });
  }

  // Calculer la tendance
  const lastDelta =
    history.length > 0 ? history[history.length - 1].delta : 0;
  const trendIcon =
    lastDelta > 0 ? (
      <TrendingUp className="size-4 text-green-500" />
    ) : lastDelta < 0 ? (
      <TrendingDown className="size-4 text-red-500" />
    ) : (
      <Minus className="size-4 text-muted-foreground" />
    );

  // Min/max pour le domaine Y
  const allElos = chartData.map((d) => d.elo);
  const minElo = allElos.length > 0 ? Math.min(...allElos) : currentElo;
  const maxElo = allElos.length > 0 ? Math.max(...allElos) : currentElo;
  const padding = Math.max(20, Math.round((maxElo - minElo) * 0.15));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {trendIcon}
              ELO Evolution
            </CardTitle>
            <CardDescription>
              {history.length > 0
                ? `${history.length} ranked game${history.length > 1 ? "s" : ""}`
                : "No ranked games yet"}
            </CardDescription>
          </div>

          {/* Toggle 1v1 / 4p */}
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={mode === "1v1" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setMode("1v1")}
            >
              1v1
            </Button>
            <Button
              variant={mode === "4p" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setMode("4p")}
            >
              4 players
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">
              Play ranked games in {mode === "1v1" ? "1v1" : "4 players"} mode to see your progress!
            </p>
            <p className="text-2xl font-bold text-foreground">{currentElo} ELO</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-elo)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-elo)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis
                domain={[minElo - padding, maxElo + padding]}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                fontSize={11}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold">{value} ELO</span>
                        {item.payload.delta !== 0 && (
                          <span
                            className={
                              item.payload.delta > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {item.payload.delta > 0 ? "+" : ""}
                            {item.payload.delta}
                          </span>
                        )}
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="elo"
                stroke="var(--color-elo)"
                strokeWidth={2}
                fill="url(#eloGradient)"
                dot={chartData.length <= 20}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
