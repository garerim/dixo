// =============================================================================
// ADMIN — Panneau de gestion des utilisateurs (client component)
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUser } from "@/types/api";

const PAGE_SIZE = 20;

const SUBSCRIPTION_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground border-border",
  premium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  vip: "bg-purple-500/20 text-purple-500 border-purple-500/30",
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = page * PAGE_SIZE;
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.rows);
        setCount(json.data.count);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdmin = async (user: AdminUser) => {
    const newValue = !user.isAdmin;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, isAdmin: newValue }),
    });
    const json = await res.json();
    if (json.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === json.data.id ? json.data : u)),
      );
      toast.success(
        newValue
          ? `${user.pseudo} is now admin.`
          : `${user.pseudo} is no longer admin.`,
      );
    } else {
      toast.error(json.error ?? "Failed to update user.");
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by pseudo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">
          <Users className="size-3 mr-1" />
          {count} users
        </Badge>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No users found.</p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pseudo</TableHead>
                <TableHead>ELO 1v1</TableHead>
                <TableHead>ELO 4p</TableHead>
                <TableHead>Games</TableHead>
                <TableHead>Wins</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.pseudo}
                      {user.isAdmin && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.elo1v1}</TableCell>
                  <TableCell className="font-mono text-sm">{user.elo4p}</TableCell>
                  <TableCell className="font-mono text-sm">{user.gamesPlayed}</TableCell>
                  <TableCell className="font-mono text-sm">{user.gamesWon}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                        SUBSCRIPTION_COLORS[user.subscription] ?? ""
                      }`}
                    >
                      {user.subscription}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        user.isOnline ? "text-green-500" : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`size-2 rounded-full ${
                          user.isOnline ? "bg-green-500" : "bg-muted-foreground"
                        }`}
                      />
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={user.isAdmin ? "destructive" : "outline"}
                      onClick={() => toggleAdmin(user)}
                    >
                      {user.isAdmin ? (
                        <>
                          <ShieldOff className="size-3.5 mr-1" />
                          Revoke
                        </>
                      ) : (
                        <>
                          <Shield className="size-3.5 mr-1" />
                          Promote
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
