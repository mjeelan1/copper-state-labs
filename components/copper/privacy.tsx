import { ShieldCheckIcon } from "lucide-react";
import { getPrivacySummary } from "@/lib/copper/catalog";

// How Copper handles recordings, in the catalog's own words (the official
// 2026 policy summary). Calm and plain, with Patina Teal accents.
export function Privacy() {
  const { policy, wakeWord, points } = getPrivacySummary();
  return (
    <section
      data-testid="privacy-summary"
      id="privacy"
      className="bg-secondary py-16 md:py-24"
    >
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {policy} privacy policy
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Your privacy, in plain words
        </h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Copper Home waits for “{wakeWord}.” Here’s what happens after that,
          and what you control.
        </p>
        <ul className="bg-card text-card-foreground border-accent mt-10 flex flex-col gap-5 rounded-xl border-l-4 p-6 md:p-8">
          {points.map((point) => (
            <li key={point} className="flex gap-3">
              <ShieldCheckIcon
                aria-hidden
                className="text-accent mt-0.5 size-5 shrink-0"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
