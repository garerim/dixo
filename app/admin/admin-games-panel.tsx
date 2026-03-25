// =============================================================================
// ADMIN — Panneau de gestion des parties (client component)
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminGame } from "@/types/api";

const PAGE_SIZE = 20;

const PHASE_COLORS: Record<string, string> = {
  LOBBY: "bg-muted text-muted-foreground border-border",
  ROLLING: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  BIDDING: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  CHALLENGE: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  RESULT: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  GAME_OVER: "bg-green-500/20 text-green-500 border-green-500/30",
};

const MODE_COLORS: Record<string, string> = {
  PRIVATE: "bg-muted text-muted-foreground border-border",
  NORMAL: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  RANKED: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
};

export function AdminGamesPanel() {
  const [games, setGames] = useState<AdminGame[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = page * PAGE_SIZE;
      const res = await fetch(
        `/api/admin/games?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const json = await res.json();
      if (json.success) {
        setGames(json.data.rows);
        setCount(json.data.count);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">
          <Gamepad2 className="size-3 mr-1" />
          {count} games
        </Badge>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : games.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No games found.</p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(game.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    <span className="ml-1 text-xs">
                      {new Date(game.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{game.joinCode}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        MODE_COLORS[game.gameMode] ?? ""
                      }`}
                    >
                      {game.gameMode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        PHASE_COLORS[game.phase] ?? ""
                      }`}
                    >
                      {game.phase}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{game.round}</TableCell>
                  <TableCell className="font-mono text-sm">{game.playerCount}</TableCell>
                  <TableCell className="text-sm">{game.hostPseudo ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {game.winnerPseudo ? (
                      <span className="text-green-500 font-medium">{game.winnerPseudo}</span>
                    ) : (
                      "—"
                    )}
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
