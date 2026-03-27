// =============================================================================
// MIDDLEWARE Next.js — Session + Protection des routes + i18n
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/config";

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES = ["/game"];

// Routes publiques (pas de redirect si connecté)
const PUBLIC_ONLY_ROUTES = ["/login"];

function negotiateLocale(request: NextRequest): Locale {
  const acceptLang = request.headers.get("Accept-Language");
  if (!acceptLang) return DEFAULT_LOCALE;

  const preferred = acceptLang
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    if (SUPPORTED_LOCALES.includes(lang as Locale)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  // 1. Rafraîchir la session Supabase
  const response = await updateSupabaseSession(request);

  // 2. Détection de la locale (cookie ou Accept-Language)
  const { pathname } = request.nextUrl;
  if (!request.cookies.get("NEXT_LOCALE")) {
    const locale = negotiateLocale(request);
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

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
