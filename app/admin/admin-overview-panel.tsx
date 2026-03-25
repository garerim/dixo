// =============================================================================
// ADMIN — Panneau d'aperçu avec statistiques (client component)
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Wifi,
  Crown,
  Gamepad2,
  CalendarDays,
  Play,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminStats } from "@/types/api";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}

function StatCard({ label, value, icon, accent = "text-foreground" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${accent}`}>{value.toLocaleString("fr-FR")}</p>
      </CardContent>
    </Card>
  );
}

export function AdminOverviewPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success) setStats(json.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-muted-foreground py-12">Failed to load stats.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Users"
        value={stats.totalUsers}
        icon={<Users className="size-5" />}
      />
      <StatCard
        label="Online Now"
        value={stats.onlineUsers}
        icon={<Wifi className="size-5" />}
        accent="text-green-500"
      />
      <StatCard
        label="Premium Subscribers"
        value={stats.premiumUsers}
        icon={<Crown className="size-5" />}
        accent="text-yellow-500"
      />
      <StatCard
        label="Total Games"
        value={stats.totalGames}
        icon={<Gamepad2 className="size-5" />}
      />
      <StatCard
        label="Games Today"
        value={stats.gamesToday}
        icon={<CalendarDays className="size-5" />}
      />
      <StatCard
        label="Active Games"
        value={stats.activeGames}
        icon={<Play className="size-5" />}
        accent="text-blue-500"
      />
      <StatCard
        label="Pending Reports"
        value={stats.pendingReports}
        icon={<Flag className="size-5" />}
        accent={stats.pendingReports > 0 ? "text-destructive" : "text-foreground"}
      />
    </div>
  );
}
