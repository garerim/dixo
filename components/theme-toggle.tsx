"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/**
 * Bouton standalone pour le header (landing page, etc.)
 */
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/**
 * Item pour le DropdownMenu (menu utilisateur)
 */
export function ThemeToggleMenuItem() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </DropdownMenuItem>
  );
}
