// =============================================================================
// COMPONENT — Wrapper for legal pages content (mentions légales, CGV, etc.)
// Applique une typographie cohérente sans dépendre de @tailwindcss/typography.
// =============================================================================

import { cn } from "@/lib/utils";

interface LegalArticleProps {
  children: React.ReactNode;
  className?: string;
}

export function LegalArticle({ children, className }: LegalArticleProps) {
  return (
    <article
      className={cn(
        "max-w-none text-[15px] leading-relaxed text-muted-foreground",
        // Headings
        "[&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground sm:[&_h1]:text-4xl",
        "[&_h2]:relative [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-24 [&_h2]:border-l-2 [&_h2]:border-primary/60 [&_h2]:pl-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground sm:[&_h2]:text-2xl",
        "[&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground sm:[&_h3]:text-lg",
        // Paragraphs
        "[&_p]:mb-4 [&_p]:leading-relaxed",
        // Strong (highlight on muted bg)
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        // Links
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-primary/80",
        // Lists
        "[&_ul]:my-4 [&_ul]:space-y-2 [&_ul]:pl-5",
        "[&_ul>li]:relative [&_ul>li]:leading-relaxed",
        "[&_ul>li]:before:absolute [&_ul>li]:before:-left-4 [&_ul>li]:before:top-[0.55em] [&_ul>li]:before:size-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-primary/60",
        // Tables
        "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-md [&_table]:border [&_table]:border-border [&_table]:text-sm",
        "[&_thead]:bg-muted/40",
        "[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground",
        "[&_td]:border-t [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
        // Code
        "[&_code]:rounded [&_code]:bg-muted/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground",
        // Sup (1ᵉʳ)
        "[&_sup]:text-[0.65em]",
        className,
      )}
    >
      {children}
    </article>
  );
}
