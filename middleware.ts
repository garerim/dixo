// =============================================================================
// MIDDLEWARE Next.js — Session + Protection des routes
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES = ["/game"];

// Routes publiques (pas de redirect si connecté)
const PUBLIC_ONLY_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  // 1. Rafraîchir la session Supabase
  const response = await updateSupabaseSession(request);

  const { pathname } = request.nextUrl;

  // 2. Vérifier l'authentification pour les routes protégées
  // On vérifie la présence du cookie de session Supabase
  const hasSession = request.cookies.getAll().some((c) =>
    c.name.includes("auth-token"),
  );

  // Protéger les routes /game/*
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rediriger de /login vers / si déjà connecté
  if (PUBLIC_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
