"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LogOut,
  Trophy,
  Users,
  UserPlus,
  User,
  Star,
  BookOpen,
  Paintbrush,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { LanguageSelector } from "@/components/language-selector";
import { NotificationBell } from "@/features/notifications";

export function MainHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

  const displayName =
    profile?.pseudo ?? user?.user_metadata?.full_name ?? "Player";
  const avatarUrl =
    profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? undefined;

  return (
    <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Dixo" width={28} height={28} className="size-7" />
        <span className="text-lg font-bold tracking-tight">{t("title")}</span>
      </Link>

      <div className="flex items-center gap-3">
        {/* ELO Badges */}
        {profile && (
          <div className="hidden gap-1.5 sm:flex">
            <Badge variant="outline" className="gap-1">
              <Trophy className="size-3" />
              1v1: {profile.elo1v1}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="size-3" />
              4p: {profile.elo4p}
            </Badge>
          </div>
        )}

        {/* Header links */}
        <Button variant="ghost" size="sm" className="hidden gap-1.5 sm:flex" asChild>
          <Link href="/tournaments">
            <Trophy className="size-4 text-yellow-500" />
            {tc("tournaments")}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="hidden gap-1.5 sm:flex" asChild>
          <Link href="/shop">
            <ShoppingBag className="size-4" />
            {tc("shop")}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="hidden gap-1.5 sm:flex" asChild>
          <Link href="/how-to-play">
            <BookOpen className="size-4" />
            {tc("howToPlay")}
          </Link>
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted">
              <Avatar className="size-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {displayName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{tn("myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 size-4" />
              <span>{tn("profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/friends")}>
              <UserPlus className="mr-2 size-4" />
              <span>{tn("friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/skins")}>
              <Paintbrush className="mr-2 size-4" />
              <span>{tn("diceSkins")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/tournaments")} className="sm:hidden">
              <Trophy className="mr-2 size-4 text-yellow-500" />
              <span>{tc("tournaments")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/shop")} className="sm:hidden">
              <ShoppingBag className="mr-2 size-4" />
              <span>{tc("shop")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/how-to-play")} className="sm:hidden">
              <BookOpen className="mr-2 size-4" />
              <span>{tc("howToPlay")}</span>
            </DropdownMenuItem>
            {profile?.subscription === "free" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/pricing")}>
                  <Star className="mr-2 size-4 fill-yellow-400 text-yellow-400" />
                  <span>{tn("upgradePremium")}</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <LanguageSelector />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 size-4" />
              <span>{tn("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
