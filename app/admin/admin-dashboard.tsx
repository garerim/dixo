// =============================================================================
// ADMIN — Dashboard principal avec navigation par onglets
// =============================================================================

"use client";

import { LayoutDashboard, Users, Gamepad2, Flag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverviewPanel } from "./admin-overview-panel";
import { AdminUsersPanel } from "./admin-users-panel";
import { AdminGamesPanel } from "./admin-games-panel";
import { AdminReportsPanel } from "./admin-reports-panel";

export function AdminDashboard() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <LayoutDashboard className="size-5 text-primary" />
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </header>

      <main className="flex-1 p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <LayoutDashboard className="size-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-4 mr-1.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="size-4 mr-1.5" />
              Games
            </TabsTrigger>
            <TabsTrigger value="reports">
              <Flag className="size-4 mr-1.5" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewPanel />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersPanel />
          </TabsContent>

          <TabsContent value="games">
            <AdminGamesPanel />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReportsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
